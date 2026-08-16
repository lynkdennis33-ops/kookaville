import { readFileSync, writeFileSync } from 'fs';

const file = 'app/(client)/dashboard/messages/page.jsx';
let content = readFileSync(file, 'utf8');

// Replace ConversationItem to show chef name + menu name + booking date + time + status badge
const oldFn = `function ConversationItem({ booking, isSelected, onClick }) {
  const name = getChefName(booking);
  const eventDate = formatEventDate(booking.eventDate);`;

const idx = content.indexOf(oldFn);
console.log('ConversationItem found at:', idx);
if (idx !== -1) {
  console.log('Nearby chars:', JSON.stringify(content.slice(idx, idx + 50)));
}

// Find the function by a unique sub-string that doesn't have special chars
const marker = 'function ConversationItem(';
const mIdx = content.indexOf(marker);
console.log('Marker idx:', mIdx);
if (mIdx !== -1) {
  console.log('Context:', JSON.stringify(content.slice(mIdx, mIdx + 200)));
}
