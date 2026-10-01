/**
 * Validates Component Layouts against channel-specific constraints.
 */

async function main() {
  const { default: LarkAdapter } = await import('../../../../server/adapters/components/LarkAdapter.js');
  const { default: TelegramAdapter } = await import('../../../../server/adapters/components/TelegramAdapter.js');

  const payload = {
    title: 'Test Title',
    content: 'Test content with fallback.',
    fallback: {
      text: 'Detailed Fallback Text',
      link: 'https://example.com/fallback'
    }
  };

  const larkAdapter = new LarkAdapter();
  const larkLayout = await larkAdapter.translateLayout(payload, { fallbackUrl: 'https://cowok.ai' });
  
  // The layout has cards array which contains elements
  const hasMarkdown = larkLayout.cards.some(card => 
    card.elements.some(el => el.tag === 'markdown' && el.content.includes('Fallback'))
  );

  if (!hasMarkdown) {
    console.error('Lark Layout Validation Failed: Fallback text is not properly wrapped.');
    process.exit(1);
  } else {
    console.log('Lark Layout Validation Passed.');
  }

  const tgAdapter = new TelegramAdapter();
  const tgLayout = await tgAdapter.translateLayout(payload, { fallbackUrl: 'https://cowok.ai' });
  
  if (tgLayout.text.includes('__') || tgLayout.text.includes('**')) { 
     console.log('Telegram basic format check.');
  }
  
  if (tgAdapter.escapeMarkdownV2('#header - *text*') !== '\\#header \\- \\*text\\*') {
      console.error('Telegram escapeMarkdownV2 failed');
      process.exit(1);
  }

  console.log('Telegram Layout Validation Passed.');
  
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
