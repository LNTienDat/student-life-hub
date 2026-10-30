// Only completed AI exchanges from this conversation are sent to Google.
export function chatbotHistory(messages) {
  const turns = [];
  for (let i = 0; i < messages.length - 1; i++) {
    const user = messages[i], bot = messages[i + 1];
    if (user.vaiTro === 'user' && user.cheDo === 'ai' && bot.vaiTro === 'bot' && bot.nguon === 'ai') {
      turns.push({ vaiTro: 'user', noiDung: user.noiDung }, { vaiTro: 'bot', noiDung: bot.noiDung.slice(0, 2000) });
      i++;
    }
  }
  while (turns.length > 6 || turns.reduce((sum, t) => sum + t.noiDung.length, 0) > 8000) turns.splice(0, 2);
  return turns;
}
