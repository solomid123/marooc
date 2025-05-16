"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { X } from "lucide-react"

interface VideoTutorialDialogProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  videoId?: string
}

export function VideoTutorialDialog({
  isOpen,
  onClose,
  title = "Mock Interview Tutorial",
  videoId = "dQw4w9WgXcQ", // This is a placeholder YouTube ID
}: VideoTutorialDialogProps) {
  // Make sure dialog doesn't interfere with screen sharing
  useEffect(() => {
    // If screen sharing is active, we should ensure this dialog doesn't block navigation
    const checkScreenSharing = () => {
      if (typeof window !== 'undefined' && document) {
        const isSharing = document.documentElement.getAttribute('data-sharing') === 'active';
        if (isSharing && isOpen) {
          console.log("Screen sharing detected while tutorial dialog is open, closing dialog");
          onClose();
        }
      }
    };
    
    checkScreenSharing();
    
    // Check periodically in case sharing starts while dialog is open
    const intervalId = setInterval(checkScreenSharing, 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [isOpen, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Learn how to use mock interviews to test the interview assistant capabilities.
          </DialogDescription>
        </DialogHeader>

        <div className="aspect-video overflow-hidden rounded-md">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 