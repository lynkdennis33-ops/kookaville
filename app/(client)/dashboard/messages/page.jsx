"use client";

import React, { useState } from "react";
import {
  Send,
  Phone,
  Video,
  Search,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chefs } from "@/mocks/data";

export default function MessagesApp() {
  const [selectedChat, setSelectedChat] = useState(chefs[0]);
  const [msgInput, setMsgInput] = useState("");

  const chatList = [
    {
      chef: chefs[0],
      lastMessage: "Looking forward to the event!",
      time: "10:45 AM",
      unread: 2,
    },
    {
      chef: chefs[1],
      lastMessage: "Yes, I can accommodate gluten-free.",
      time: "Yesterday",
      unread: 0,
    },
  ];

  return (
    <div className="h-[700px] border border-border rounded-2xl overflow-hidden bg-card flex shadow-sm">
      {/* Sidebar: Chat List */}
      <div className="w-1/3 min-w-[300px] border-r border-border bg-muted/20 flex flex-col">
        <div className="p-4 border-b border-border bg-card">
          <h2 className="text-xl font-bold mb-4">Messages</h2>
          <Input
            placeholder="Search conversations..."
            leftIcon={<Search className="h-4 w-4" />}
            className="h-10 bg-background"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {chatList.map((chat) => (
            <div
              key={chat.chef.id}
              onClick={() => setSelectedChat(chat.chef)}
              className={`p-4 border-b border-border/50 cursor-pointer transition-colors flex items-center gap-3 ${selectedChat?.id === chat.chef.id ? "bg-secondary" : "hover:bg-secondary/50"}`}
            >
              <div className="relative">
                <img
                  src={chat.chef.avatar}
                  className="w-12 h-12 rounded-full object-cover"
                  alt="Avatar"
                />
                {chat.unread > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background">
                    {chat.unread}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h4 className="font-semibold text-sm truncate">
                    {chat.chef.name}
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    {chat.time}
                  </span>
                </div>
                <p
                  className={`text-xs truncate ${chat.unread > 0 ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                >
                  {chat.lastMessage}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col bg-background">
          {/* Header */}
          <div className="h-16 px-6 border-b border-border flex items-center justify-between bg-card shrink-0">
            <div className="flex flex-col">
              <span className="font-bold flex items-center gap-2">
                Chef {selectedChat.name.split(" ")[0]}
                {selectedChat.verified && (
                  <span className="text-accent text-xs bg-accent/10 px-1.5 py-0.5 rounded-full">
                    Pro
                  </span>
                )}
              </span>
              <span className="text-xs text-emerald-500 font-medium tracking-wide">
                ● Online
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground"
              >
                <Phone className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground"
              >
                <Video className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="sm" className="hidden lg:flex">
                <Calendar className="h-4 w-4 mr-2" /> Booking Details
              </Button>
            </div>
          </div>

          {/* Messages Window */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/always-grey.png')] bg-opacity-20 relative">
            <div className="flex justify-center mt-4 mb-8">
              <span className="text-xs font-semibold bg-secondary text-secondary-foreground px-3 py-1 rounded-full uppercase tracking-wider">
                Today
              </span>
            </div>

            <div className="flex gap-4 max-w-[85%]">
              <img
                src={selectedChat.avatar}
                className="w-10 h-10 rounded-full object-cover mt-auto"
                alt="Avatar"
              />
              <div className="bg-secondary p-4 rounded-2xl rounded-bl-sm space-y-2 relative shadow-sm">
                <p className="text-sm">
                  Hi James! I saw your booking request for the 15th for 4
                  guests.
                </p>
                <div className="text-[10px] text-muted-foreground text-right mt-1">
                  10:41 AM
                </div>
              </div>
            </div>

            <div className="flex gap-4 max-w-[85%]">
              <img
                src={selectedChat.avatar}
                className="w-10 h-10 rounded-full object-cover mt-auto opacity-0"
                alt="Avatar"
              />
              <div className="bg-secondary p-4 rounded-2xl rounded-bl-sm space-y-2 relative shadow-sm">
                <p className="text-sm">
                  Before confirming, I noticed a severe peanut allergy. Did you
                  mean strict no nuts in the facility or just avoiding peanuts?
                </p>
                <div className="text-[10px] text-muted-foreground text-right mt-1">
                  10:42 AM
                </div>
              </div>
            </div>

            <div className="flex gap-4 max-w-[85%] ml-auto justify-end">
              <div className="bg-primary text-primary-foreground p-4 rounded-2xl rounded-br-sm space-y-2 relative shadow-sm">
                <p className="text-sm text-white">
                  Hi Chef! It's just peanuts. Tree nuts like almonds and walnuts
                  are totally fine.
                </p>
                <div className="text-[10px] text-primary-foreground/70 text-right mt-1">
                  10:45 AM
                </div>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-border bg-card shrink-0">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 rounded-full text-muted-foreground hover:bg-secondary"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
              </Button>
              <Input
                className="flex-1 bg-secondary border-transparent rounded-full px-5 focus-visible:ring-1 focus-visible:ring-primary h-12"
                placeholder="Type your message..."
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setMsgInput("");
                  }
                }}
              />

              <Button
                size="icon"
                className="shrink-0 rounded-full bg-accent hover:bg-accent/90 focus-visible:ring-accent h-12 w-12 shadow-sm"
              >
                <Send className="h-5 w-5 pr-0.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-background">
          <MessageSquare className="h-16 w-16 text-muted-foreground/30 mb-6" />
          <p className="text-xl font-semibold text-muted-foreground">
            Select a conversation to start messaging
          </p>
        </div>
      )}
    </div>
  );
}
