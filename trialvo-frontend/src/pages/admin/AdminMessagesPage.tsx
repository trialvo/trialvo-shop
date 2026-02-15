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
    <h1 className="text-2xl font-bold text-white">Messages</h1>
    <p className="text-sm text-gray-400">Customer contact messages</p>
   </div>

   <div className="relative max-w-sm">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
    <Input
     placeholder="Search messages..."
     value={search}
     onChange={(e) => setSearch(e.target.value)}
     className="pl-10 bg-[#161822] border-white/10 text-white placeholder:text-gray-500"
    />
   </div>

   <Card className="bg-[#161822] border-white/[0.08]">
    <CardContent className="p-0">
     {isLoading ? (
      <div className="p-6 space-y-3">
       {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 bg-white/5" />
       ))}
      </div>
     ) : (
      <div className="overflow-x-auto">
       <table className="w-full">
        <thead>
         <tr className="border-b border-white/[0.08]">
          <th className="text-left text-xs text-gray-400 font-medium py-3 px-4">Sender</th>
          <th className="text-left text-xs text-gray-400 font-medium py-3 px-4">Subject</th>
          <th className="text-left text-xs text-gray-400 font-medium py-3 px-4">Date</th>
          <th className="text-left text-xs text-gray-400 font-medium py-3 px-4">Status</th>
          <th className="text-right text-xs text-gray-400 font-medium py-3 px-4">Actions</th>
         </tr>
        </thead>
        <tbody>
         {filtered?.map((msg) => (
          <tr
           key={msg.id}
           className={`border-b border-white/[0.05] last:border-0 hover:bg-white/[0.03] cursor-pointer ${!msg.is_read ? 'bg-primary/5' : ''
            }`}
           onClick={() => handleView(msg)}
          >
           <td className="py-3 px-4">
            <div>
             <p className={`text-sm ${!msg.is_read ? 'font-semibold text-white' : 'text-gray-300'}`}>
              {msg.name}
             </p>
             <p className="text-xs text-gray-400">{msg.email}</p>
            </div>
           </td>
           <td className="py-3 px-4">
            <p className={`text-sm ${!msg.is_read ? 'font-medium text-white' : 'text-gray-300'}`}>
             {msg.subject}
            </p>
            <p className="text-xs text-gray-500 truncate max-w-[200px]">{msg.message}</p>
           </td>
           <td className="py-3 px-4">
            <span className="text-xs text-gray-400">
             {new Date(msg.created_at).toLocaleDateString()}
            </span>
           </td>
           <td className="py-3 px-4">
            {msg.is_read ? (
             <Badge variant="outline" className="text-[11px] border-white/10 text-gray-400">Read</Badge>
            ) : (
             <Badge variant="outline" className="text-[11px] border-primary/30 text-primary bg-primary/10">Unread</Badge>
            )}
           </td>
           <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-end gap-1">
             <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-white"
              onClick={() => handleToggleRead(msg.id, !msg.is_read)}
              title={msg.is_read ? 'Mark as unread' : 'Mark as read'}
             >
              {msg.is_read ? <Mail className="w-4 h-4" /> : <MailOpen className="w-4 h-4" />}
             </Button>
             <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-red-400"
              onClick={() => setDeleteId(msg.id)}
             >
              <Trash2 className="w-4 h-4" />
             </Button>
            </div>
           </td>
          </tr>
         ))}
        </tbody>
       </table>
       {filtered?.length === 0 && (
        <div className="text-center py-12 text-gray-500">No messages found</div>
       )}
      </div>
     )}
    </CardContent>
   </Card>

   {/* View Message Dialog */}
   <Dialog open={!!viewMessage} onOpenChange={() => setViewMessage(null)}>
    <DialogContent className="bg-[#1e2030] border-white/10 text-white max-w-lg">
     <DialogHeader>
      <DialogTitle>{viewMessage?.subject}</DialogTitle>
     </DialogHeader>
     {viewMessage && (
      <div className="space-y-4 mt-4">
       <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
         <span className="text-gray-400">From</span>
         <p className="font-medium">{viewMessage.name}</p>
        </div>
        <div>
         <span className="text-gray-400">Email</span>
         <p>{viewMessage.email}</p>
        </div>
        <div>
         <span className="text-gray-400">Date</span>
         <p>{new Date(viewMessage.created_at).toLocaleString()}</p>
        </div>
       </div>
       <div>
        <span className="text-sm text-gray-400">Message</span>
        <p className="bg-white/5 p-4 rounded-lg mt-1 text-sm leading-relaxed whitespace-pre-wrap">
         {viewMessage.message}
        </p>
       </div>
      </div>
     )}
    </DialogContent>
   </Dialog>

   {/* Delete Confirmation */}
   <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
    <AlertDialogContent className="bg-[#1e2030] border-white/10">
     <AlertDialogHeader>
      <AlertDialogTitle className="text-white">Delete Message</AlertDialogTitle>
      <AlertDialogDescription className="text-gray-400">
       Are you sure? This action cannot be undone.
      </AlertDialogDescription>
     </AlertDialogHeader>
     <AlertDialogFooter>
      <AlertDialogCancel className="border-white/10 text-gray-300 hover:bg-white/5">Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
     </AlertDialogFooter>
    </AlertDialogContent>
   </AlertDialog>
  </div>
 );
};

export default AdminMessagesPage;
