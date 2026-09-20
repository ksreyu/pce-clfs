export const CATEGORIES = [
  'Electronics', 'Books', 'Bags', 'Wallets', 'ID Cards', 'Keys',
  'Clothing', 'Accessories', 'Documents', 'Stationery', 'Other',
];

export const LOCATIONS = [
  'PCE Library (Ground Floor)',
  'PCE Library (1st Floor)',
  'PCE Library (2nd Floor)',
  'PCE Cafeteria',
  'Lecture Hall 101',
  'Lecture Hall 102',
  'Lecture Hall 201',
  'Lecture Hall 202',
  'Computer Lab 1',
  'Computer Lab 2',
  'Computer Lab 3',
  'Electronics Lab',
  'Mechanical Workshop',
  'Automobile Lab',
  'Sports Complex',
  'PCE Parking Lot',
  'PCE Hostel',
  'Admin Building',
  'PCE Grounds',
  'PCE Main Gate',
  'Staff Room',
  'Seminar Hall',
  'Placement Cell',
  'Exam Cell',
  'Other',
];

export const DEPARTMENTS = [
  'Computer Engineering',
  'Information Technology',
  'Electronics & Computer Science',
  'Electronics & Telecommunication',
  'Mechanical Engineering',
  'Automobile Engineering',
  'Applied Science and Mathematics',
  'Administration',
];

export const YEARS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  'Masters',
  'Ph.D.',
  'Faculty',
  'N/A',
];

export function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function getStatusVariant(status: string): 'danger' | 'success' | 'info' | 'warning' | 'default' | 'purple' {
  switch (status) {
    case 'LOST': return 'danger';
    case 'FOUND': return 'success';
    case 'MATCHED': return 'info';
    case 'CLAIMED': return 'warning';
    case 'VERIFIED': return 'info';
    case 'RECOVERED': return 'success';
    case 'CLOSED': return 'default';
    case 'ARCHIVED': return 'default';
    case 'PENDING': return 'warning';
    case 'APPROVED': return 'success';
    case 'REJECTED': return 'danger';
    case 'UNDER_REVIEW': return 'info';
    case 'COMPLETED': return 'purple';
    default: return 'default';
  }
}

export function getItemEmoji(category: string): string {
  switch (category) {
    case 'Electronics': return '📱';
    case 'Books': return '📚';
    case 'Bags': return '🎒';
    case 'Wallets': return '👛';
    case 'ID Cards': return '🪪';
    case 'Keys': return '🔑';
    case 'Clothing': return '👕';
    case 'Accessories': return '⌚';
    case 'Documents': return '📄';
    case 'Stationery': return '✏️';
    default: return '📦';
  }
}

export function getItemPlaceholder(category: string): string {
  switch (category) {
    case 'Electronics': return '/placeholders/electronics.svg';
    case 'Books': return '/placeholders/books.svg';
    case 'Bags': return '/placeholders/bags.svg';
    case 'Wallets': return '/placeholders/wallets.svg';
    case 'ID Cards': return '/placeholders/id-cards.svg';
    case 'Keys': return '/placeholders/keys.svg';
    case 'Clothing': return '/placeholders/clothing.svg';
    case 'Accessories': return '/placeholders/accessories.svg';
    case 'Documents': return '/placeholders/documents.svg';
    case 'Stationery': return '/placeholders/stationery.svg';
    default: return '/placeholders/other.svg';
  }
}
