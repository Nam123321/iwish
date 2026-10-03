import os, sys
# --- [Watchmen Core Injection] ---
_script_dir = os.path.dirname(os.path.abspath(__file__))
_agent_dir = os.path.abspath(os.path.join(_script_dir, ".."))
if _agent_dir not in sys.path:
    sys.path.insert(0, _agent_dir)
try:
    import watchmen_core
    watchmen_core.verify_execution(__file__)
except ImportError:
    pass # Ignore for environment without watchmen_core, let the system handle it
# ---------------------------------

import os

def ensure_dir(path):
    os.makedirs(path, exist_ok=True)

def write_file(path, content):
    ensure_dir(os.path.dirname(path))
    with open(path, 'w') as f:
        f.write(content)

# 1. API Route: GET /api/tenant/ui-kits/templates
write_file('src/app/api/tenant/ui-kits/templates/route.ts', '''
import { NextResponse } from 'next/server';

export async function GET() {
  // Mock response for template list
  return NextResponse.json([{ id: 'tpl-1', name: 'KPI Dashboard', type: 'UI_KIT_TEMPLATE' }]);
}
''')

# 2. API Route: GET & POST overrides
write_file('src/app/api/tenant/ui-kits/overrides/[templateId]/route.ts', '''
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: { templateId: string } }) {
  const overrides = await prisma.tenantComponentOverride.findMany({
    where: { componentLayoutId: params.templateId, tenantId: 'mock-tenant' }
  });
  return NextResponse.json(overrides);
}

export async function POST(request: Request, { params }: { params: { templateId: string } }) {
  const body = await request.json();
  const override = await prisma.tenantComponentOverride.create({
    data: {
      tenantId: 'mock-tenant',
      componentLayoutId: params.templateId,
      nodeDefId: body.nodeDefId,
      appearanceConfig: body.appearanceConfig || {},
      dataSourceMapping: body.dataSourceMapping || {},
      disabledComponents: body.disabledComponents || {},
      nodeConfig: body.nodeConfig || {},
      version: 1
    }
  });
  return NextResponse.json(override);
}
''')

# 3. API Route: GET Data Sources
write_file('src/app/api/tenant/data-sources/route.ts', '''
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json([{ id: 'ds-1', name: 'Revenue API', schema: {} }]);
}
''')

# 4. Shared types
write_file('src/shared/api-contracts.d.ts', '''
export interface Template {
  id: string;
  name: string;
  type: string;
}
export interface TenantComponentOverride {
  id: string;
  tenantId: string;
  componentLayoutId: string;
  nodeDefId?: string;
  appearanceConfig: any;
  dataSourceMapping: any;
  disabledComponents: any;
  nodeConfig: any;
}
''')

# 5. UI Component: TemplateConfigurator
write_file('src/components/features/template-configurator/TemplateConfigurator.tsx', '''
"use client";
import React, { useState, useEffect } from 'react';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';

export default function TemplateConfigurator({ templateId }: { templateId: string }) {
  const [activeTab, setActiveTab] = useState('appearance');
  const [nodeConfig, setNodeConfig] = useState({});

  const handleSave = async () => {
    await fetch(`/api/tenant/ui-kits/overrides/${templateId}`, {
      method: 'POST',
      body: JSON.stringify({ nodeConfig, nodeDefId: 'node-1' })
    });
    alert('Saved');
  };

  const schema = {
    title: "Node Config",
    type: "object",
    properties: {
      chartTitle: { type: "string", title: "Chart Title" },
      chartType: { type: "string", enum: ["Bar", "Line", "Area"] }
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-64 border-r p-4">
        <div className="flex gap-2 mb-4">
          <button onClick={() => setActiveTab('appearance')}>Apperance</button>
          <button onClick={() => setActiveTab('data')}>Data</button>
          <button onClick={() => setActiveTab('node')}>Node Config</button>
        </div>
        {activeTab === 'node' && (
          <Form schema={schema} validator={validator} formData={nodeConfig} onChange={e => setNodeConfig(e.formData)} />
        )}
      </div>
      <div className="flex-1 p-4">
        <h2>Live Preview (Debounced)</h2>
        <div className="preview-container border p-4">
           {/* useDynamicComponent wrapper placeholder */}
           Chart Title: {(nodeConfig as any).chartTitle || 'N/A'}
        </div>
        <button onClick={handleSave} className="mt-4 bg-blue-500 text-white px-4 py-2">Save & Deploy</button>
      </div>
    </div>
  );
}
''')

print("Code generated successfully.")
