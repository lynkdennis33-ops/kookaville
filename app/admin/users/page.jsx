import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MoreVertical } from "lucide-react";

export default function AdminUsersPage() {
  const users = [
    {
      id: "U1",
      name: "James C.",
      email: "james@example.com",
      role: "Client",
      joined: "Mar 1, 2026",
      status: "Active",
    },
    {
      id: "U2",
      name: "Gordon R.",
      email: "gordon@chef.com",
      role: "Chef",
      joined: "Feb 15, 2026",
      status: "Active",
    },
    {
      id: "U3",
      name: "Bad Actor",
      email: "spam@bot.com",
      role: "Client",
      joined: "Mar 10, 2026",
      status: "Suspended",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Users Management
          </h1>
          <p className="text-muted-foreground">
            Manage roles, permissions, and account status.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search users by name or email..."
          leftIcon={<Search className="h-4 w-4" />}
          className="max-w-md"
        />
        <Button variant="outline">Filters</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/20">
                  <th className="px-6 py-4 font-bold">User</th>
                  <th className="px-6 py-4 font-bold">Role</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Joined</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-secondary/10 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs uppercase">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold">{user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{user.role}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${user.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {user.joined}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Plus({ className }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
