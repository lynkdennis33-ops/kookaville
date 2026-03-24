"use client";

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function ChefMenuManagement() {
  const [menus, setMenus] = useState([
    {
      id: 1,
      name: 'Signature Tasting Menu',
      price: 150,
      description: 'A 5-course culinary journey highlighting seasonal, local ingredients with modern French techniques.',
      dietary: ['Vegetarian Options'],
      status: 'Active',
      courses: 5,
      image: 'https://images.unsplash.com/photo-1544025162-8315ea07ec93?w=500&auto=format&fit=crop'
    },
    {
      id: 2,
      name: 'Rustic Italian Family Style',
      price: 90,
      description: 'Generous portions of handmade pasta, braised meats, and classic Italian desserts perfect for sharing.',
      dietary: ['Gluten-Free Options'],
      status: 'Active',
      courses: 3,
      image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=500&auto=format&fit=crop'
    },
    {
      id: 3,
      name: 'Elevated Sushi Experience',
      price: 200,
      description: 'Omakase-style sushi dinner featuring premium cuts of fish flown in directly from Japan.',
      dietary: ['Pescatarian'],
      status: 'Draft',
      courses: 8,
      image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&auto=format&fit=crop'
    }
  ]);

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Menu Management</h1>
          <p className="text-muted-foreground mt-1">Create, edit, and organize the menus you offer to clients.</p>
        </div>
        
        <Button className="shrink-0 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Create New Menu
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-card p-4 rounded-xl border border-border">
        <div className="relative w-full sm:max-w-xs">
          <Input 
            placeholder="Search menus..." 
            leftIcon={<Search className="h-4 w-4 text-muted-foreground" />}
            className="bg-background"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2 bg-background">
            <Filter className="h-4 w-4" /> Filter
          </Button>
        </div>
      </div>

      {/* Menus List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {menus.map(menu => (
          <div key={menu.id} className="border border-border rounded-2xl bg-card overflow-hidden flex flex-col sm:flex-row transition-colors hover:border-primary/30">
            <div className="h-48 sm:h-auto sm:w-48 shrink-0 relative">
              <img src={menu.image} alt={menu.name} className="w-full h-full object-cover" />
              <div className="absolute top-3 left-3">
                <Badge variant={menu.status === 'Active' ? 'success' : 'secondary'} className="shadow-lg">
                  {menu.status}
                </Badge>
              </div>
            </div>
            
            <div className="p-6 flex flex-col justify-between flex-1">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg leading-tight pr-4">{menu.name}</h3>
                  <div className="font-bold text-accent text-xl">${menu.price} <span className="text-xs font-normal text-muted-foreground block text-right mt-[-4px]">/person</span></div>
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {menu.description}
                </p>
                
                <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground mb-4">
                  <span className="bg-secondary px-2 py-1 rounded-md">{menu.courses} Courses</span>
                  <div className="flex gap-1">
                    {menu.dietary.map((d, i) => (
                      <span key={i} className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{d}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <Edit2 className="h-4 w-4 mr-2" /> Edit Menu
                </Button>
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
