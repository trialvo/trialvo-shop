import React, { useState } from 'react';
import { Search, Mail, MailOpen, Trash2, Eye } from 'lucide-react';
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
  type ContactMessage,
} from '@/hooks/admin/useAdminMessages';

const AdminMessagesPage: React.FC = () => {
  const { toast } = useToast();
  const { data: messages, isLoading } = useAdminMessages();
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Messages</h1>
        <p className="text-sm text-muted-foreground mt-1">Customer contact messages</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search messages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/25"
        />
      </div>

      <Card className="bg-card border-border card-shadow">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 bg-muted" />
              ))}
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden p-4 space-y-4">
                {filtered?.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-xl border p-4 space-y-3 cursor-pointer transition-all hover:bg-muted/40 shadow-soft-sm ${!msg.is_read
                      ? 'border-l-4 border-l-primary border-t-border border-r-border border-b-border bg-primary/5'
                      : 'border-border bg-muted/20'
                      }`}
                    onClick={() => handleView(msg)}
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-border/50 pb-2">
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm truncate ${!msg.is_read ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>
                          {msg.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{msg.email}</p>
                      </div>
                      {msg.is_read ? (
                        <Badge variant="outline" className="text-[10px] border-border text-muted-foreground flex-shrink-0">Read</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/10 flex-shrink-0 font-semibold">Unread</Badge>
                      )}
                    </div>
                    <div>
                      <p className={`text-sm ${!msg.is_read ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>
                        {msg.subject}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">{msg.message}</p>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{new Date(msg.created_at).toLocaleDateString()}</span>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent hover:shadow-soft-sm transition-all" onClick={() => handleToggleRead(msg.id, !msg.is_read)}>
                          {msg.is_read ? <Mail className="w-4 h-4" /> : <MailOpen className="w-4 h-4 text-primary" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" onClick={() => setDeleteId(msg.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {filtered?.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground font-medium">No messages found</div>
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs text-muted-foreground font-semibold uppercase tracking-wider py-4 px-5">Sender</th>
                      <th className="text-left text-xs text-muted-foreground font-semibold uppercase tracking-wider py-4 px-5">Subject</th>
                      <th className="text-left text-xs text-muted-foreground font-semibold uppercase tracking-wider py-4 px-5 hidden lg:table-cell">Date</th>
                      <th className="text-left text-xs text-muted-foreground font-semibold uppercase tracking-wider py-4 px-5">Status</th>
                      <th className="text-right text-xs text-muted-foreground font-semibold uppercase tracking-wider py-4 px-5">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered?.map((msg) => (
                      <tr
                        key={msg.id}
                        className={`border-b border-border/50 last:border-0 hover:bg-muted/30 cursor-pointer transition-colors ${!msg.is_read ? 'bg-primary/5' : ''}`}
                        onClick={() => handleView(msg)}
                      >
                        <td className="py-4 px-5">
                          <div>
                            <p className={`text-sm ${!msg.is_read ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>{msg.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{msg.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <p className={`text-sm ${!msg.is_read ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>{msg.subject}</p>
                          <p className="text-xs text-muted-foreground/70 truncate max-w-[300px] mt-0.5">{msg.message}</p>
                        </td>
                        <td className="py-4 px-5 hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleDateString()}</span>
                        </td>
                        <td className="py-4 px-5">
                          {msg.is_read ? (
                            <Badge variant="outline" className="text-[11px] border-border text-muted-foreground bg-muted/50">Read</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[11px] border-primary/30 text-primary bg-primary/10 font-semibold tracking-wide">Unread</Badge>
                          )}
                        </td>
                        <td className="py-4 px-5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" onClick={() => handleToggleRead(msg.id, !msg.is_read)} title={msg.is_read ? 'Mark as unread' : 'Mark as read'}>
                              {msg.is_read ? <Mail className="w-4 h-4" /> : <MailOpen className="w-4 h-4 text-primary" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" onClick={() => setDeleteId(msg.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered?.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground font-medium">No messages found</div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* View Message Dialog */}
      <Dialog open={!!viewMessage} onOpenChange={() => setViewMessage(null)}>
        <DialogContent className="bg-card border-border shadow-soft-xl max-w-lg">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="text-foreground text-lg leading-tight">{viewMessage?.subject}</DialogTitle>
          </DialogHeader>
          {viewMessage && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">From</span>
                  <p className="font-semibold text-foreground mt-1">{viewMessage.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Email</span>
                  <p className="text-foreground mt-1">{viewMessage.email}</p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Date</span>
                  <p className="text-foreground mt-1">{new Date(viewMessage.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Message</span>
                <p className="bg-muted/50 border border-border p-4 rounded-lg mt-2 text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap shadow-soft-sm">
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
