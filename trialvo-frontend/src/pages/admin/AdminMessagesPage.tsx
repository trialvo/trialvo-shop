import React, { useState } from 'react';
import { Search, Mail, MailOpen, Trash2, Eye, MessageSquare, Inbox } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAdminMessages,
  useToggleMessageRead,
  useDeleteMessage,
  useUnreadCount,
  type ContactMessage,
} from '@/hooks/admin/useAdminMessages';

const AdminMessagesPage: React.FC = () => {
  const { toast } = useToast();
  const { data: messages, isLoading } = useAdminMessages();
  const { data: unreadCount } = useUnreadCount();
  const toggleRead = useToggleMessageRead();
  const deleteMessage = useDeleteMessage();

  const [search, setSearch] = useState('');
  const [viewMessage, setViewMessage] = useState<ContactMessage | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = messages?.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.subject.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleRead = async (id: string, is_read: boolean) => {
    try {
      await toggleRead.mutateAsync({ id, is_read });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMessage.mutateAsync(deleteId);
      toast({ title: 'Message deleted' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setDeleteId(null);
  };

  const handleView = (msg: ContactMessage) => {
    setViewMessage(msg);
    if (!msg.is_read) {
      handleToggleRead(msg.id, true);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getInitialColor = (name: string) => {
    const colors = [
      'bg-violet-500/15 text-violet-500',
      'bg-blue-500/15 text-blue-500',
      'bg-emerald-500/15 text-emerald-500',
      'bg-amber-500/15 text-amber-500',
      'bg-rose-500/15 text-rose-500',
      'bg-cyan-500/15 text-cyan-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div className="admin-page-header">
          <h1>Messages</h1>
          <p>Customer contact messages and inquiries</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
            <span className="text-[11px] text-muted-foreground font-medium">Total</span>
            <span className="text-sm font-bold text-foreground">{messages?.length || 0}</span>
          </div>
          {unreadCount && unreadCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/20">
              <span className="text-[11px] text-primary font-medium">Unread</span>
              <span className="text-sm font-bold text-primary">{unreadCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="admin-search max-w-sm">
        <Search />
        <Input
          placeholder="Search messages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="admin-card">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 bg-muted" />
            ))}
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden p-3 space-y-2">
              {filtered?.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-xl border p-4 space-y-3 cursor-pointer transition-all hover:bg-muted/30 ${!msg.is_read
                    ? 'border-l-[3px] border-l-primary border-t-border border-r-border border-b-border bg-primary/[0.03]'
                    : 'border-border'
                    }`}
                  onClick={() => handleView(msg)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${getInitialColor(msg.name)}`}>
                      <span className="text-[11px] font-bold">{getInitials(msg.name)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm truncate ${!msg.is_read ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>
                          {msg.name}
                        </p>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">{new Date(msg.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className={`text-sm truncate mt-0.5 ${!msg.is_read ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                        {msg.subject}
                      </p>
                      <p className="text-xs text-muted-foreground/70 line-clamp-1 mt-0.5">{msg.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border/30" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent" onClick={() => handleToggleRead(msg.id, !msg.is_read)}>
                      {msg.is_read ? <Mail className="w-3.5 h-3.5" /> : <MailOpen className="w-3.5 h-3.5 text-primary" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(msg.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {filtered?.length === 0 && (
                <div className="admin-empty">
                  <Inbox />
                  <p>No messages found</p>
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="admin-table-header">
                    <th>Sender</th>
                    <th>Subject</th>
                    <th className="hidden lg:table-cell">Date</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered?.map((msg) => (
                    <tr
                      key={msg.id}
                      className={`admin-table-row cursor-pointer group ${!msg.is_read ? 'bg-primary/[0.02]' : ''}`}
                      onClick={() => handleView(msg)}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          {/* Unread dot */}
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${!msg.is_read ? 'bg-primary' : 'bg-transparent'}`} />
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${getInitialColor(msg.name)}`}>
                            <span className="text-[11px] font-bold">{getInitials(msg.name)}</span>
                          </div>
                          <div>
                            <p className={`text-sm ${!msg.is_read ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>{msg.name}</p>
                            <p className="text-[11px] text-muted-foreground/70 mt-0.5">{msg.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p className={`text-sm ${!msg.is_read ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>{msg.subject}</p>
                        <p className="text-[11px] text-muted-foreground/60 truncate max-w-[300px] mt-0.5">{msg.message}</p>
                      </td>
                      <td className="hidden lg:table-cell">
                        <span className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleDateString()}</span>
                      </td>
                      <td>
                        {msg.is_read ? (
                          <span className="admin-badge admin-badge-read">Read</span>
                        ) : (
                          <span className="admin-badge admin-badge-unread">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            Unread
                          </span>
                        )}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent" onClick={() => handleToggleRead(msg.id, !msg.is_read)} title={msg.is_read ? 'Mark as unread' : 'Mark as read'}>
                            {msg.is_read ? <Mail className="w-4 h-4" /> : <MailOpen className="w-4 h-4 text-primary" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(msg.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered?.length === 0 && (
                <div className="admin-empty">
                  <Inbox />
                  <p>No messages found</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* View Message Dialog */}
      <Dialog open={!!viewMessage} onOpenChange={() => setViewMessage(null)}>
        <DialogContent className="bg-card border-border shadow-soft-xl max-w-lg">
          <DialogHeader className="border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${viewMessage ? getInitialColor(viewMessage.name) : ''}`}>
                <span className="text-xs font-bold">{viewMessage ? getInitials(viewMessage.name) : ''}</span>
              </div>
              <div>
                <DialogTitle className="text-foreground text-base leading-tight">{viewMessage?.subject}</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">From {viewMessage?.name}</p>
              </div>
            </div>
          </DialogHeader>
          {viewMessage && (
            <div className="space-y-5 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/20 border border-border/50">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Email</span>
                  <p className="text-sm text-foreground mt-0.5 truncate">{viewMessage.email}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/20 border border-border/50">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Date</span>
                  <p className="text-sm text-foreground mt-0.5">{new Date(viewMessage.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Message</span>
                <p className="bg-muted/20 border border-border/50 p-4 rounded-xl mt-2 text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {viewMessage.message}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border shadow-soft-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Message</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-foreground bg-transparent hover:bg-muted">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:opacity-90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminMessagesPage;
