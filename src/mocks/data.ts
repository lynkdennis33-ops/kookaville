// src/mocks/data.ts
export const categories = [
  { id: '1', name: 'Fine Dining', icon: 'UtensilsCrossed', image: '/images/fine-dining.jpg' },
  { id: '2', name: 'Vegan', icon: 'Leaf', image: '/images/vegan.jpg' },
  { id: '3', name: 'Halal', icon: 'Beef', image: '/images/halal.jpg' },
  { id: '4', name: 'Sushi & Japanese', icon: 'Fish', image: '/images/sushi.jpg' },
  { id: '5', name: 'Italian', icon: 'Pizza', image: '/images/italian.jpg' },
  { id: '6', name: 'BBQ & Grill', icon: 'Flame', image: '/images/bbq.jpg' },
  { id: '7', name: 'Meal Prep', icon: 'Package', image: '/images/meal-prep.jpg' },
  { id: '8', name: 'Desserts', icon: 'Cake', image: '/images/desserts.jpg' },
];

export const chefs = [
  {
    id: 'chef_1',
    name: 'Gordon Ramsey-ish',
    rating: 4.9,
    reviews: 124,
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&auto=format&fit=crop',
    bio: 'Award-winning chef with 15 years of culinary excellence in fine dining.',
    specialties: ['Fine Dining', 'Italian', 'French'],
    dietary: ['Vegetarian-friendly'],
    location: 'New York, NY',
    pricePerPerson: 150,
    coverImage: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=1000&auto=format&fit=crop',
    featured: true,
    gallery: [
      'https://images.unsplash.com/photo-1544025162-8315ea07ec93?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1514326640560-7d063ef8aedc?w=500&auto=format&fit=crop',
    ],
  },
  {
    id: 'chef_2',
    name: 'Maria Rossi',
    rating: 4.8,
    reviews: 89,
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=500&auto=format&fit=crop',
    bio: 'Authentic Italian cuisine crafted with love and fresh, organic ingredients.',
    specialties: ['Italian', 'Pasta', 'Mediterranean'],
    dietary: ['Gluten-Free Options'],
    location: 'Brooklyn, NY',
    pricePerPerson: 90,
    coverImage: 'https://images.unsplash.com/photo-1498579150354-979475344aef?w=1000&auto=format&fit=crop',
    featured: true,
    gallery: [
      'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=500&auto=format&fit=crop',
    ],
  },
  {
    id: 'chef_3',
    name: 'David Kim',
    rating: 5.0,
    reviews: 210,
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=500&auto=format&fit=crop',
    bio: 'Innovative sushi master bridging traditional technique with modern flair.',
    specialties: ['Sushi & Japanese', 'Asian Fusion'],
    dietary: ['Pescatarian'],
    location: 'Manhattan, NY',
    pricePerPerson: 200,
    coverImage: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=1000&auto=format&fit=crop',
    featured: false,
    gallery: [
      'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&auto=format&fit=crop',
    ],
  },
  {
    id: 'chef_4',
    name: 'Sarah Jenkins',
    rating: 4.7,
    reviews: 56,
    verified: false,
    avatar: 'https://images.unsplash.com/photo-1607990283143-e81e7a2c9349?w=500&auto=format&fit=crop',
    bio: 'Plant-based chef specializing in vibrant, nourishing vegan meals.',
    specialties: ['Vegan', 'Healthy', 'Meal Prep'],
    dietary: ['Vegan', 'Gluten-Free'],
    location: 'Queens, NY',
    pricePerPerson: 75,
    coverImage: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1000&auto=format&fit=crop',
    featured: true,
    gallery: [
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=500&auto=format&fit=crop',
    ],
  }
];

export const clientBookings = [
  {
    id: 'b1',
    chefId: 'chef_2',
    date: '2026-04-15T19:00:00Z',
    guests: 4,
    status: 'upcoming',
    totalPrice: 400,
    specialRequests: 'No nuts for one guest.'
  },
  {
    id: 'b2',
    chefId: 'chef_1',
    date: '2026-03-01T18:30:00Z',
    guests: 2,
    status: 'completed',
    totalPrice: 350,
    specialRequests: 'Anniversary dinner.'
  }
];

export const reviews = [
  {
    id: 'r1',
    chefId: 'chef_1',
    author: 'Emily Chen',
    rating: 5,
    date: '2026-03-05',
    content: 'Absolutely phenomenal experience. The food was incredible and the presentation was a work of art.',
  },
  {
    id: 'r2',
    chefId: 'chef_1',
    author: 'Michael B.',
    rating: 4,
    date: '2026-02-28',
    content: 'Very good! A bit pricey, but worth it for a special occasion.',
  }
];
