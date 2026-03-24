"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Filter, ShieldCheck, FileText, Check, X, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function ChefVerificationInterface() {
  const pendingChefs = [
    { id: '1', name: 'Marco Pierre', email: 'marco@example.com', date: 'Mar 12, 2026', type: 'Fine Dining' },
    { id: '2', name: 'Alice Waters', email: 'alice@example.com', date: 'Mar 13, 2026', type: 'Farm-to-Table' }
  ];

  return (
    <div className="space-y-8">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Chef Verification</h1>
          <p className="text-muted-foreground mt-1">Review and approve new private chef applications.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Pending Applications List */}
        <Card className="lg:col-span-1 border-border flex flex-col min-h-[600px]">
          <CardHeader className="pb-4 border-b border-border/50 flex flex-row items-center justify-between bg-muted/20">
            <CardTitle className="text-lg">Pending Reviews (12)</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto">
             <div className="p-4 bg-background">
               <Input placeholder="Search applicants..." leftIcon={<Search className="h-4 w-4 text-muted-foreground" />} />
             </div>
             <div className="divide-y divide-border">
                {pendingChefs.map(chef => (
                  <div key={chef.id} className="p-4 bg-background cursor-pointer hover:bg-secondary/50 border-l-4 border-accent">
                    <h3 className="font-bold text-foreground">{chef.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2 mt-0.5">{chef.type} • Applied {chef.date}</p>
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md inline-flex w-fit mt-2">
                       <ShieldCheck className="h-3 w-3" /> Docs Uploaded
                    </div>
                  </div>
                ))}
             </div>
             <div className="p-6 text-center text-sm text-muted-foreground">
                End of pending list.
             </div>
          </CardContent>
        </Card>

        {/* Selected Application Review UI */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border">
            <CardHeader className="pb-4 border-b border-border/50 bg-muted/20">
               <div className="flex items-start justify-between">
                 <div className="flex items-center gap-4">
                   <div className="w-16 h-16 bg-gradient-to-tr from-primary to-accent rounded-xl text-white font-bold flex items-center justify-center text-2xl">M</div>
                   <div>
                     <CardTitle className="text-2xl font-bold">Marco Pierre</CardTitle>
                     <CardDescription className="text-sm font-medium mt-1">marco@example.com • New York, NY</CardDescription>
                   </div>
                 </div>
                 <div className="flex gap-2">
                   <Button variant="outline" className="text-red-500 hover:text-red-700 bg-background hover:bg-red-50 border-red-200">
                     <X className="mr-2 h-4 w-4" /> Reject
                   </Button>
                   <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20">
                     <Check className="mr-2 h-4 w-4" /> Approve Chef
                   </Button>
                 </div>
               </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-8">
                 
                 {/* Bio Section */}
                 <div>
                   <h3 className="text-lg font-bold mb-3 border-b border-border pb-2">Profile Details</h3>
                   <div className="grid grid-cols-2 gap-y-4 gap-x-8 mt-4 text-sm">
                     <div>
                       <span className="text-muted-foreground block mb-1">Cuisines</span>
                       <span className="font-semibold">Fine Dining, French, Modern Italian</span>
                     </div>
                     <div>
                       <span className="text-muted-foreground block mb-1">Background Check</span>
                       <span className="font-bold text-emerald-600 flex items-center gap-1"><ShieldCheck className="h-4 w-4" /> Cleared</span>
                     </div>
                     <div className="col-span-2">
                       <span className="text-muted-foreground block mb-1">Bio</span>
                       <span className="font-medium text-foreground leading-relaxed block">
                         Over 15 years cultivating the highest standard of modern European cuisine in Michelin-starred environments. Looking to bring theatrical dining experiences directly to clients' homes.
                       </span>
                     </div>
                   </div>
                 </div>

                 {/* Documents Section */}
                 <div>
                   <h3 className="text-lg font-bold mb-4 border-b border-border pb-2">Uploaded Documents</h3>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                     <div className="border border-border/50 bg-secondary/50 rounded-xl p-4 flex gap-4 items-center">
                       <div className="p-3 bg-white rounded-lg border border-border shrink-0 shadow-sm">
                         <FileText className="h-6 w-6 text-accent" />
                       </div>
                       <div className="flex-1">
                         <h4 className="font-bold text-sm">Government ID</h4>
                         <p className="text-xs text-muted-foreground mt-0.5">passport_scan.pdf (2.4MB)</p>
                       </div>
                       <Button size="sm" variant="outline" className="bg-white">View</Button>
                     </div>

                     <div className="border border-border/50 bg-secondary/50 rounded-xl p-4 flex gap-4 items-center">
                       <div className="p-3 bg-white rounded-lg border border-border shrink-0 shadow-sm">
                         <FileText className="h-6 w-6 text-blue-500" />
                       </div>
                       <div className="flex-1">
                         <h4 className="font-bold text-sm">Food Handler Cert.</h4>
                         <p className="text-xs text-muted-foreground mt-0.5">food_safety_cert.pdf (1.1MB)</p>
                       </div>
                       <Button size="sm" variant="outline" className="bg-white">View</Button>
                     </div>
                   </div>
                 </div>

                 {/* Action Needed */}
                 <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex gap-4">
                   <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                   <div>
                     <h4 className="font-bold text-amber-800">Action Required</h4>
                     <p className="text-sm text-amber-700/80 mt-1 leading-relaxed">
                       Please review the government ID carefully to ensure it matches the name on the background check prior to granting approval. Once approved, Marco will be able to accept live platform bookings immediately.
                     </p>
                   </div>
                 </div>

              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
