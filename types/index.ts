import type { Database } from "./database";

export type Visitor = Database["public"]["Tables"]["visitors"]["Row"];
export type VisitorInsert = Database["public"]["Tables"]["visitors"]["Insert"];
export type VisitorUpdate = Database["public"]["Tables"]["visitors"]["Update"];

export type Visit = Database["public"]["Tables"]["visits"]["Row"];
export type VisitInsert = Database["public"]["Tables"]["visits"]["Insert"];
export type VisitUpdate = Database["public"]["Tables"]["visits"]["Update"];

export type VisitorImage = Database["public"]["Tables"]["visitor_images"]["Row"];
export type VisitorImageInsert = Database["public"]["Tables"]["visitor_images"]["Insert"];

export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type CommentInsert = Database["public"]["Tables"]["comments"]["Insert"];

export type VisitWithVisitor = Visit & {
  visitor: Visitor;
};

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    visitId: string;
    visitorId: string;
    memo: string | null;
    color: string;
  };
};
