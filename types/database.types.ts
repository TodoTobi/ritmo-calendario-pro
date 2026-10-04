export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type EventTier = 'tier_1' | 'tier_2' | 'tier_3';
export type EventTierSemantic = 'tier_1_inamovible' | 'tier_2_movible' | 'tier_3_habito_carga';

export type EventColor = 'red' | 'orange' | 'blue' | 'green' | 'yellow' | 'purple';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'rescheduled' | 'cancelled';

export type AlertCadence = '7_days' | '3_days' | '2_days' | '24_hours' | '2_hours';

export type AlertStatus = 'scheduled' | 'quiet_suppressed' | 'dispatched' | 'failed';

export type CreatedFromSource = 'web' | 'telegram_voice' | 'telegram_ocr' | 'classroom_sync' | 'template';

export type UserProfile = {
  id: string;
  username: string;
  full_name: string;
  timezone: string;
  telegram_chat_id: number | null;
  google_refresh_token: string | null;
  google_token_expiry: string | null;
  created_at: string;
  updated_at: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string;
  end_time: string;
  tier: EventTier;
  color: EventColor;
  is_inamovible: boolean;
  difficulty_score: number | null;
  classroom_coursework_id: string | null;
  created_from: CreatedFromSource;
  created_at: string;
  updated_at: string;
};

export type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority_tier: EventTier;
  due_date: string | null;
  difficulty_score: number | null;
  linked_event_id: string | null;
  classroom_coursework_id: string | null;
  created_at: string;
  updated_at: string;
};

export type RoutineTemplate = {
  id: string;
  title: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  tier: EventTier;
  color: EventColor;
  description: string | null;
  is_active: boolean;
};

export type ClassroomSyncItem = {
  id: string;
  course_id: string;
  course_name: string;
  coursework_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  alternate_link: string | null;
  state: string;
  last_synced_at: string;
};

export type NoteItem = {
  id: string;
  title: string;
  content_markdown: string;
  category_tag: string;
  linked_date: string | null;
  linked_event_id: string | null;
  is_completed: boolean;
  synced_to_drive: boolean;
  drive_file_id: string | null;
  created_at: string;
  updated_at: string;
};

export type AlertQueueItem = {
  id: string;
  event_id: string;
  cadence: AlertCadence;
  scheduled_for: string;
  status: AlertStatus;
  suppressed_until: string | null;
  dispatched_at: string | null;
  error_message: string | null;
  created_at: string;
};

export type RescheduleProposal = {
  id: string;
  source_event_id: string | null;
  detected_overflow_reason: string;
  scenarios_json: {
    A: {
      label: string;
      updates: Array<{ eventId: string; newDate: string; newStartTime: string; newEndTime: string }>;
    };
    B: {
      label: string;
      updates: Array<{ eventId: string; newDate: string; newStartTime: string; newEndTime: string }>;
    };
    C: {
      label: string;
      updates: Array<{ eventId: string; newDate: string; newStartTime: string; newEndTime: string }>;
    };
  };
  selected_scenario: 'A' | 'B' | 'C' | null;
  status: 'pending' | 'applied' | 'rejected';
  created_at: string;
  resolved_at: string | null;
};

export type TelegramConversation = {
  id: string;
  chat_id: number;
  message_id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  intent_detected: string | null;
  media_url: string | null;
  created_at: string;
};

export type AuditLog = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_state: Json | null;
  new_state: Json | null;
  performed_by: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      users_profile: {
        Row: UserProfile;
        Insert: Partial<UserProfile> & Pick<UserProfile, 'username'>;
        Update: Partial<UserProfile>;
        Relationships: [];
      };
      events: {
        Row: CalendarEvent;
        Insert: Omit<CalendarEvent, 'id' | 'is_inamovible' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<CalendarEvent>;
        Relationships: [];
      };
      tasks: {
        Row: TaskItem;
        Insert: Omit<TaskItem, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<TaskItem>;
        Relationships: [];
      };
      routine_templates: {
        Row: RoutineTemplate;
        Insert: Omit<RoutineTemplate, 'id'> & { id?: string };
        Update: Partial<RoutineTemplate>;
        Relationships: [];
      };
      classroom_sync: {
        Row: ClassroomSyncItem;
        Insert: Omit<ClassroomSyncItem, 'id' | 'last_synced_at'> & {
          id?: string;
          last_synced_at?: string;
        };
        Update: Partial<ClassroomSyncItem>;
        Relationships: [];
      };
      notes: {
        Row: NoteItem;
        Insert: Omit<NoteItem, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<NoteItem>;
        Relationships: [];
      };
      alerts_queue: {
        Row: AlertQueueItem;
        Insert: Omit<AlertQueueItem, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<AlertQueueItem>;
        Relationships: [];
      };
      reschedule_proposals: {
        Row: RescheduleProposal;
        Insert: Omit<RescheduleProposal, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<RescheduleProposal>;
        Relationships: [];
      };
      telegram_conversations: {
        Row: TelegramConversation;
        Insert: Omit<TelegramConversation, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<TelegramConversation>;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<AuditLog>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      apply_reschedule_scenario: {
        Args: {
          p_proposal_id: string;
          p_scenario_key: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      event_tier: EventTier;
      event_color: EventColor;
      task_status: TaskStatus;
      alert_cadence: AlertCadence;
      alert_status: AlertStatus;
    };
  };
}
