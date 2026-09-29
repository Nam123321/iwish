import { prisma } from '../db';
import crypto from 'crypto';
import dns from 'dns/promises';
import { isIP } from 'net';
import { URL } from 'url';

const MAX_PAYLOAD_SIZE = 1024 * 1024; // 1MB
const MAX_RETRIES = 5;

// EC-P1-001: SSRF Protection
export async function isSafeUrl(targetUrl: string): Promise<boolean> {
  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    
    const host = parsed.hostname;
    let ip = host;
    if (!isIP(host)) {
      try {
        const lookup = await dns.lookup(host);
        ip = lookup.address;
      } catch (err) {
        return false; // Cannot resolve
      }
    }
    
    // Check internal ranges
    const parts = ip.split('.').map(Number);
    if (parts.length === 4) {
      if (
        parts[0] === 127 || 
        parts[0] === 10 || 
        (parts[0] === 169 && parts[1] === 254) ||
        (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
        (parts[0] === 192 && parts[1] === 168)
      ) {
        return false;
      }
    }
    if (ip === '::1') return false;
    return true;
  } catch (err) {
    return false;
  }
}

export async function registerWebhookEndpoint(tenantId: string, url: string, secret: string, description?: string) {
  const isSafe = await isSafeUrl(url);
  if (!isSafe) {
    throw new Error('Invalid URL: Potential SSRF or unresolvable domain detected');
  }
  
  return prisma.webhookEndpoint.create({
    data: {
      tenantId,
      url,
      secret,
      description
    }
  });
}

// EC-P3-001: Timestamp for out of order
export async function queueWebhookEvent(tenantId: string, endpointId: string, eventType: string, payloadObj: any) {
  const enrichedPayload = {
    ...payloadObj,
    _meta: {
      eventType,
      timestamp: new Date().toISOString()
    }
  };
  
  const payloadString = JSON.stringify(enrichedPayload);
  
  // EC-P8-001: Check size before queueing
  const payloadSize = Buffer.byteLength(payloadString, 'utf8');
  if (payloadSize > MAX_PAYLOAD_SIZE) {
    throw new Error('Payload size exceeds 1MB limit');
  }

  const defaultStatus = 'PENDING';
  return prisma.webhookEvent.create({
    data: {
      tenantId,
      endpointId,
      eventType,
      payload: payloadString,
      status: defaultStatus
    }
  });
}

export async function dispatchWebhookEvent(eventId: string) {
  const event = await prisma.webhookEvent.findUnique({
    where: { id: eventId },
    include: { endpoint: true }
  });
  
  if (!event || event.status !== 'PENDING') return;

  const payloadSize = Buffer.byteLength(event.payload, 'utf8');
  if (payloadSize > MAX_PAYLOAD_SIZE) {
    await prisma.webhookEvent.update({
      where: { id: event.id },
      data: { status: 'FAILED', responseBody: 'Payload size exceeded 1MB limit' }
    });
    return;
  }

  const signature = crypto.createHmac('sha256', event.endpoint.secret)
    .update(event.payload)
    .digest('hex');

  const controller = new AbortController();
  // EC-P5-001: 5 second timeout
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  
  try {
    const response = await fetch(event.endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-I-Wish-Signature': signature
      },
      body: event.payload,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      await prisma.webhookEvent.update({
        where: { id: event.id },
        data: {
          status: 'SUCCESS',
          responseStatusCode: response.status,
          responseBody: 'OK'
        }
      });
    } else {
      // EC-P5-002: 429 Retry-After
      await handleFailure(event, response.status, response.headers.get('retry-after'));
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    await handleFailure(event, 0, null, err.name === 'AbortError' ? 'Timeout' : err.message);
  }
}

async function handleFailure(event: any, statusCode: number, retryAfterStr: string | null, errorMessage?: string) {
  if (event.retryCount >= MAX_RETRIES) {
    await prisma.webhookEvent.update({
      where: { id: event.id },
      data: {
        status: 'FAILED',
        responseStatusCode: statusCode,
        responseBody: errorMessage || `Failed with status ${statusCode}`
      }
    });
    return;
  }

  let delayMs = Math.pow(2, event.retryCount) * 1000; // Exponential backoff

  if (statusCode === 429 && retryAfterStr) {
    const retryAfter = parseInt(retryAfterStr, 10);
    if (!isNaN(retryAfter)) {
      delayMs = retryAfter * 1000;
    } else {
      const date = new Date(retryAfterStr);
      if (!isNaN(date.getTime())) {
        delayMs = Math.max(0, date.getTime() - Date.now());
      }
    }
  }

  const nextRetryAt = new Date(Date.now() + delayMs);

  await prisma.webhookEvent.update({
    where: { id: event.id },
    data: {
      retryCount: event.retryCount + 1,
      nextRetryAt,
      responseStatusCode: statusCode,
      responseBody: errorMessage || `Failed with status ${statusCode}`
    }
  });
}
