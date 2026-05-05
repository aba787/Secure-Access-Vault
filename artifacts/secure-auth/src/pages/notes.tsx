import { useState, useRef, useEffect } from "react";
import { 
  useListNotes, 
  useCreateNote, 
  useUpdateNote, 
  useDeleteNote,
  getListNotesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Lock, 
  Plus, 
  FileText, 
  Trash2, 
  ShieldCheck, 
  Clock, 
  Search,
  CheckCircle2,
  ChevronLeft
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link } from "wouter";

export default function Notes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);

  // Queries & Mutations
  const { data: notes, isLoading: isLoadingNotes } = useListNotes({
    query: { queryKey: getListNotesQueryKey() }
  });

  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  // Selected note state
  const selectedNote = notes?.find(n => n.id === selectedNoteId);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Sync selected note to local state
  useEffect(() => {
    if (selectedNote) {
      setTitle(selectedNote.title);
      setContent(selectedNote.content);
      setIsEditing(false);
    } else {
      setTitle("");
      setContent("");
      setIsEditing(false);
    }
  }, [selectedNoteId, selectedNote]);

  // Handle mobile view responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filteredNotes = notes?.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleCreateNew = () => {
    setSelectedNoteId(null);
    setTitle("");
    setContent("");
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your note.",
        variant: "destructive",
      });
      return;
    }

    if (selectedNoteId) {
      updateNote.mutate(
        { id: selectedNoteId, data: { title, content } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
            setIsEditing(false);
            toast({
              title: "Note updated",
              description: "Your note has been securely encrypted and saved.",
            });
          },
          onError: () => {
            toast({
              title: "Failed to update",
              description: "There was an error saving your note.",
              variant: "destructive",
            });
          }
        }
      );
    } else {
      createNote.mutate(
        { data: { title, content } },
        {
          onSuccess: (newNote) => {
            queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
            setSelectedNoteId(newNote.id);
            setIsEditing(false);
            toast({
              title: "Note created",
              description: "Your new note has been securely encrypted and saved.",
            });
          },
          onError: () => {
            toast({
              title: "Failed to create",
              description: "There was an error creating your note.",
              variant: "destructive",
            });
          }
        }
      );
    }
  };

  const handleDelete = (id: number) => {
    deleteNote.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
          if (selectedNoteId === id) {
            setSelectedNoteId(null);
          }
          setIsDeleting(null);
          toast({
            title: "Note deleted",
            description: "The note has been permanently removed from the vault.",
          });
        },
        onError: () => {
          toast({
            title: "Failed to delete",
            description: "There was an error deleting your note.",
            variant: "destructive",
          });
          setIsDeleting(null);
        }
      }
    );
  };

  // Determine which pane to show on mobile
  const showListPane = !isMobileView || (!selectedNoteId && !isEditing);
  const showDetailPane = !isMobileView || selectedNoteId || isEditing;

  return (
    <AuthLayout requireAuth>
      <div className="container mx-auto p-4 md:p-8 max-w-6xl h-[calc(100vh-4rem)] flex flex-col animate-in fade-in duration-500">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
              <Link href="/dashboard" className="hover:text-foreground transition-colors cursor-pointer flex items-center">
                <ChevronLeft className="w-4 h-4 mr-1" /> Dashboard
              </Link>
            </div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              Secure Notes
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
                <Lock className="w-3 h-3" />
                <span>AES-256</span>
              </div>
            </h1>
            <p className="text-muted-foreground mt-1">Your end-to-end encrypted personal vault.</p>
          </div>
          <Button onClick={handleCreateNew} className="shrink-0 gap-2 shadow-md group">
            <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
            New Note
          </Button>
        </div>

        <div className="flex flex-1 gap-6 min-h-0 overflow-hidden">
          {/* List Pane */}
          {showListPane && (
            <Card className={`border-border/50 shadow-md bg-card/50 backdrop-blur flex flex-col shrink-0 ${isMobileView ? 'w-full' : 'w-80 lg:w-96'}`}>
              <div className="p-4 border-b border-border/50 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search vault..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-background/50 border-border/50"
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {isLoadingNotes ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-3 rounded-lg border border-border/50 bg-background/30 flex gap-3 opacity-70">
                      <div className="w-10 h-10 rounded-full bg-muted animate-pulse shrink-0" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))
                ) : filteredNotes.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground animate-in fade-in duration-500">
                    <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                      <ShieldCheck className="w-8 h-8 opacity-20" />
                    </div>
                    <p className="font-medium text-foreground mb-1">
                      {searchQuery ? "No notes found" : "Vault is empty"}
                    </p>
                    <p className="text-sm">
                      {searchQuery ? "Try adjusting your search terms." : "Create a new secure note to get started."}
                    </p>
                  </div>
                ) : (
                  filteredNotes.map((note, index) => (
                    <div 
                      key={note.id}
                      onClick={() => setSelectedNoteId(note.id)}
                      className={`group p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2`}
                      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                      data-active={selectedNoteId === note.id}
                    >
                      <div 
                        className={`absolute inset-0 rounded-xl transition-opacity duration-300 pointer-events-none ${
                          selectedNoteId === note.id ? 'bg-primary/5 opacity-100' : 'bg-transparent opacity-0 group-hover:bg-muted/50 group-hover:opacity-100'
                        }`} 
                      />
                      <div className={`relative flex justify-between items-start ${
                        selectedNoteId === note.id ? 'border-primary/30' : 'border-border/50 group-hover:border-border'
                      }`}>
                        <div className="flex-1 min-w-0 pr-2 z-10">
                          <h3 className={`font-medium truncate ${selectedNoteId === note.id ? 'text-primary' : 'text-foreground group-hover:text-primary/80 transition-colors'}`}>
                            {note.title || "Untitled Note"}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {note.content || "Empty content"}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity -mr-1 -mt-1 z-20 hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsDeleting(note.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="relative flex items-center text-[10px] text-muted-foreground/70 font-medium z-10 mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}

          {/* Detail Pane */}
          {showDetailPane && (
            <Card className="flex-1 border-border/50 shadow-md bg-card/50 backdrop-blur flex flex-col min-w-0 overflow-hidden relative">
              {(!selectedNoteId && !isEditing) ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground animate-in zoom-in-95 duration-500">
                  <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center mb-6">
                    <Lock className="w-10 h-10 text-primary/40" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">Select a Note</h2>
                  <p className="max-w-xs text-sm">
                    Choose a note from the sidebar to view its decrypted contents, or create a new one.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col h-full animate-in fade-in duration-300">
                  {/* Editor Header */}
                  <div className="flex items-center justify-between p-4 border-b border-border/50 shrink-0 bg-background/30">
                    <div className="flex items-center gap-3">
                      {isMobileView && (
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedNoteId(null); setIsEditing(false); }} className="-ml-2">
                          <ChevronLeft className="w-5 h-5" />
                        </Button>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500/70" />
                        Encrypted & Synced
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedNoteId && !isEditing && (
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                          Edit Note
                        </Button>
                      )}
                      {isEditing && (
                        <Button size="sm" onClick={handleSave} disabled={createNote.isPending || updateNote.isPending}>
                          {(createNote.isPending || updateNote.isPending) ? "Saving..." : "Save Securely"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Editor Body */}
                  <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-background/10">
                    <div className="max-w-3xl mx-auto space-y-6">
                      {isEditing ? (
                        <>
                          <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Note Title"
                            className="text-3xl md:text-4xl font-bold border-none bg-transparent shadow-none px-0 h-auto focus-visible:ring-0 rounded-none placeholder:text-muted-foreground/30 text-foreground"
                            autoFocus
                          />
                          <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Write your secure thoughts here..."
                            className="min-h-[400px] text-base leading-relaxed border-none bg-transparent shadow-none px-0 focus-visible:ring-0 rounded-none resize-none placeholder:text-muted-foreground/30"
                          />
                        </>
                      ) : (
                        <>
                          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                            {selectedNote?.title}
                          </h2>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground py-2 border-y border-border/30">
                            <span>Created {selectedNote && format(new Date(selectedNote.createdAt), 'MMM d, yyyy')}</span>
                            <span>•</span>
                            <span>Updated {selectedNote && formatDistanceToNow(new Date(selectedNote.updatedAt), { addSuffix: true })}</span>
                          </div>
                          <div className="whitespace-pre-wrap text-base leading-relaxed text-foreground/90 mt-6 pb-20">
                            {selectedNote?.content}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      <AlertDialog open={isDeleting !== null} onOpenChange={(open) => !open && setIsDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete secure note?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your note from the encrypted vault.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => isDeleting && handleDelete(isDeleting)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteNote.isPending}
            >
              {deleteNote.isPending ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AuthLayout>
  );
}