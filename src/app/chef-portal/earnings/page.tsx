import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Download, ArrowUpRight, TrendingUp } from 'lucide-react';

export default function ChefEarningsPage() {
  const transactions = [
    { id: 'T1', client: 'James C.', date: 'Mar 15, 2026', amount: 1500, status: 'Pending' },
    { id: 'T2', client: 'Sarah M.', date: 'Mar 02, 2026', amount: 350, status: 'Completed' },
    { id: 'T3', client: 'Robert D.', date: 'Feb 24, 2026', amount: 820, status: 'Completed' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Earnings</h1>
          <p className="text-muted-foreground">Track your revenue and payouts.</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" /> Download Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$12,450</div>
            <p className="text-xs text-emerald-500 font-medium flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" /> +18% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$1,500</div>
            <p className="text-xs text-muted-foreground mt-1">Next payout Mar 20</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available to Withdraw</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$0</div>
            <Button size="sm" variant="outline" className="mt-2 w-full" disabled>Withdraw</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 border border-border rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-secondary rounded-full flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold">{tx.client}</p>
                    <p className="text-sm text-muted-foreground">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">${tx.amount}</p>
                  <p className={`text-xs ${tx.status === 'Completed' ? 'text-emerald-500' : 'text-amber-500'}`}>{tx.status}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
