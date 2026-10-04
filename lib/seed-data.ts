import { CalendarEvent, NoteItem } from '@/types/database.types';

export function generateRealOctoberEvents(): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  // Helper to format date YYYY-MM-DD
  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Generate events for October 1 to November 15, 2026
  for (let day = 1; day <= 31; day++) {
    const dateStr = formatDate(2026, 10, day);
    const dateObj = new Date(2026, 9, day); // month is 0-indexed (9 = Oct)
    const dayOfWeek = dateObj.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

    // 1. TODOS LOS DÍAS: Devocional con Dios (Tier 1 Inamovible)
    events.push({
      id: `ev-god-${dateStr}`,
      title: 'Devocional Diario con Dios',
      description: 'Oración matutina y lectura bíblica personal.',
      event_date: dateStr,
      start_time: '06:45:00',
      end_time: '07:30:00',
      tier: 'tier_1',
      color: 'green',
      is_inamovible: true,
      difficulty_score: 1,
      classroom_coursework_id: null,
      created_from: 'template',
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    });

    // 2. TODOS LOS DÍAS: Hábitos de Crecimiento Personal (Tier 3)
    // Guitarra e Inglés
    events.push({
      id: `ev-guitar-eng-${dateStr}`,
      title: 'Guitarra & Práctica de Inglés',
      description: 'Práctica diaria de instrumento y fluidez oral en inglés.',
      event_date: dateStr,
      start_time: dayOfWeek === 0 || dayOfWeek === 6 ? '15:00:00' : '12:30:00',
      end_time: dayOfWeek === 0 || dayOfWeek === 6 ? '16:00:00' : '13:30:00',
      tier: 'tier_3',
      color: 'green',
      is_inamovible: false,
      difficulty_score: 2,
      classroom_coursework_id: null,
      created_from: 'template',
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    });

    // Estudio y Proyectos de IA
    events.push({
      id: `ev-ai-projects-${dateStr}`,
      title: 'Proyectos & Estudio de IA',
      description: 'Desarrollo de repositorios, prompts, agentes y autoeducación tecnológica.',
      event_date: dateStr,
      start_time: dayOfWeek === 6 ? '15:30:00' : '16:00:00',
      end_time: dayOfWeek === 6 ? '17:00:00' : '18:15:00',
      tier: 'tier_3',
      color: 'purple',
      is_inamovible: false,
      difficulty_score: 4,
      classroom_coursework_id: null,
      created_from: 'template',
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-01T00:00:00Z',
    });

    // Gimnasio con pesas (Días de semana y sábado)
    if (dayOfWeek !== 0) {
      events.push({
        id: `ev-gym-${dateStr}`,
        title: 'Entrenamiento de Pesas (Gimnasio)',
        description: 'Acondicionamiento físico y rutina de fuerza.',
        event_date: dateStr,
        start_time: dayOfWeek === 2 || dayOfWeek === 4 ? '16:45:00' : '20:30:00',
        end_time: dayOfWeek === 2 || dayOfWeek === 4 ? '18:00:00' : '21:45:00',
        tier: 'tier_3',
        color: 'green',
        is_inamovible: false,
        difficulty_score: 3,
        classroom_coursework_id: null,
        created_from: 'template',
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
      });
    }

    // 3. EVENTOS ESPECÍFICOS POR DÍA DE SEMANA
    if (dayOfWeek === 1) {
      // Lunes: Pasantías presenciales hasta tarde
      events.push({
        id: `ev-mon-school-${dateStr}`,
        title: 'Colegio Técnico & Pasantías Presenciales',
        description: 'Jornada escolar técnica con regreso a casa a las 18:00.',
        event_date: dateStr,
        start_time: '07:45:00',
        end_time: '18:00:00',
        tier: 'tier_2',
        color: 'blue',
        is_inamovible: false,
        difficulty_score: 3,
        classroom_coursework_id: null,
        created_from: 'template',
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
      });
      // Dibujo Técnico Lámina A
      events.push({
        id: `ev-lamina-mon-${dateStr}`,
        title: `Dibujo Técnico — Lámina Semana ${Math.ceil(day / 7)} (Bloque 1)`,
        description: 'Formato normalizado IRAM / Dibujo Técnico.',
        event_date: dateStr,
        start_time: '18:30:00',
        end_time: '20:30:00',
        tier: 'tier_3',
        color: 'orange',
        is_inamovible: false,
        difficulty_score: 4,
        classroom_coursework_id: null,
        created_from: 'template',
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
      });
    } else if (dayOfWeek === 2 || dayOfWeek === 4) {
      // Martes y Jueves: Salida 12:00, pasantías virtuales y luego INSTITUTO DE INGLÉS (Tier 1)
      events.push({
        id: `ev-intern-virt-${dateStr}`,
        title: 'Pasantías Virtuales (Flexible)',
        description: 'Bloque de trabajo virtual de pasantía.',
        event_date: dateStr,
        start_time: '13:30:00',
        end_time: '16:00:00',
        tier: 'tier_2',
        color: 'blue',
        is_inamovible: false,
        difficulty_score: 3,
        classroom_coursework_id: null,
        created_from: 'template',
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
      });
      events.push({
        id: `ev-english-inst-${dateStr}`,
        title: 'Instituto de Inglés (Clase Presencial)',
        description: 'Clase formal de gramática y conversación en Instituto.',
        event_date: dateStr,
        start_time: '18:30:00',
        end_time: '20:30:00',
        tier: 'tier_1',
        color: 'blue',
        is_inamovible: true,
        difficulty_score: 3,
        classroom_coursework_id: null,
        created_from: 'template',
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
      });
    } else if (dayOfWeek === 3) {
      // Miércoles: Iglesia en la noche (Tier 1 Inamovible)
      events.push({
        id: `ev-wed-school-${dateStr}`,
        title: 'Colegio Técnico (Salida)',
        description: 'Horario escolar de miércoles.',
        event_date: dateStr,
        start_time: '07:45:00',
        end_time: '13:00:00',
        tier: 'tier_2',
        color: 'blue',
        is_inamovible: false,
        difficulty_score: 2,
        classroom_coursework_id: null,
        created_from: 'template',
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
      });
      // Lámina B
      events.push({
        id: `ev-lamina-wed-${dateStr}`,
        title: `Dibujo Técnico — Lámina Semana ${Math.ceil(day / 7)} (Bloque 2)`,
        description: 'Construcción geométrica y acotaciones.',
        event_date: dateStr,
        start_time: '16:00:00',
        end_time: '18:00:00',
        tier: 'tier_3',
        color: 'orange',
        is_inamovible: false,
        difficulty_score: 4,
        classroom_coursework_id: null,
        created_from: 'template',
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
      });
      events.push({
        id: `ev-church-wed-${dateStr}`,
        title: 'Reunión de Iglesia (Miércoles)',
        description: 'Servicio y comunión en la Iglesia.',
        event_date: dateStr,
        start_time: '19:00:00',
        end_time: '21:30:00',
        tier: 'tier_1',
        color: 'green',
        is_inamovible: true,
        difficulty_score: 1,
        classroom_coursework_id: null,
        created_from: 'template',
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
      });
    } else if (dayOfWeek === 5) {
      // Viernes: Colegio + Lámina C
      events.push({
        id: `ev-fri-school-${dateStr}`,
        title: 'Colegio Técnico (Cierre de Semana)',
        description: 'Clases técnicas escolares de viernes.',
        event_date: dateStr,
        start_time: '07:45:00',
        end_time: '13:20:00',
        tier: 'tier_2',
        color: 'blue',
        is_inamovible: false,
        difficulty_score: 2,
        classroom_coursework_id: null,
        created_from: 'template',
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
      });
      events.push({
        id: `ev-lamina-fri-${dateStr}`,
        title: `Dibujo Técnico — Lámina Semana ${Math.ceil(day / 7)} (Bloque 3 Final)`,
        description: 'Tinta y rotulado final de lámina semanal.',
        event_date: dateStr,
        start_time: '14:00:00',
        end_time: '16:00:00',
        tier: 'tier_3',
        color: 'orange',
        is_inamovible: false,
        difficulty_score: 4,
        classroom_coursework_id: null,
        created_from: 'template',
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
      });
    } else if (dayOfWeek === 6) {
      // Sábado: UTN Ingreso (08:00 a 14:30 Tier 1) + Iglesia (17:00 a 23:00 Tier 1)
      if (day === 24) {
        // PARCIAL UTN 24 DE OCTUBRE
        events.push({
          id: `ev-parcial-utn-${dateStr}`,
          title: '🚨 EXAMEN PARCIAL 2 UTN — MATEMÁTICA',
          description: 'Segundo examen parcial decisivo de ingreso a la UTN FRBA.',
          event_date: dateStr,
          start_time: '08:00:00',
          end_time: '14:30:00',
          tier: 'tier_1',
          color: 'red',
          is_inamovible: true,
          difficulty_score: 5,
          classroom_coursework_id: null,
          created_from: 'template',
          created_at: '2026-10-01T00:00:00Z',
          updated_at: '2026-10-01T00:00:00Z',
        });
      } else {
        events.push({
          id: `ev-utn-sat-${dateStr}`,
          title: 'UTN Ingreso — Cursada Sábados',
          description: 'Matemática y Física — Curso intensivo de ingreso universitario.',
          event_date: dateStr,
          start_time: '08:00:00',
          end_time: '14:30:00',
          tier: 'tier_1',
          color: 'red',
          is_inamovible: true,
          difficulty_score: 5,
          classroom_coursework_id: null,
          created_from: 'template',
          created_at: '2026-10-01T00:00:00Z',
          updated_at: '2026-10-01T00:00:00Z',
        });
      }

      events.push({
        id: `ev-church-sat-${dateStr}`,
        title: 'Servicio de Iglesia & Jóvenes (Sábado)',
        description: 'Reunión de jóvenes y servicio general.',
        event_date: dateStr,
        start_time: '17:00:00',
        end_time: '23:00:00',
        tier: 'tier_1',
        color: 'green',
        is_inamovible: true,
        difficulty_score: 1,
        classroom_coursework_id: null,
        created_from: 'template',
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
      });
    } else if (dayOfWeek === 0) {
      // Domingo: Torneo Fútbol 5 a plata (08:00 - 14:00 Tier 1) + Iglesia (18:00 - 23:00 Tier 1)
      events.push({
        id: `ev-soccer-sun-${dateStr}`,
        title: '⚽ Torneo de Fútbol 5 (Por Plata)',
        description: 'Competición matutina en torneo dominical de fútbol 5.',
        event_date: dateStr,
        start_time: '08:00:00',
        end_time: '14:00:00',
        tier: 'tier_1',
        color: 'blue',
        is_inamovible: true,
        difficulty_score: 4,
        classroom_coursework_id: null,
        created_from: 'template',
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
      });
      events.push({
        id: `ev-church-sun-${dateStr}`,
        title: 'Servicio Principal de Iglesia (Domingo)',
        description: 'Reunión general de domingo en la Iglesia.',
        event_date: dateStr,
        start_time: '18:00:00',
        end_time: '23:00:00',
        tier: 'tier_1',
        color: 'green',
        is_inamovible: true,
        difficulty_score: 1,
        classroom_coursework_id: null,
        created_from: 'template',
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
      });
    }
  }

  // Add November 7: Recuperatorio UTN
  events.push({
    id: 'ev-recup-utn-2026-11-07',
    title: '⚠️ RECUPERATORIO UTN MATEMÁTICA',
    description: 'Instancia final de recuperatorio del curso de ingreso UTN FRBA.',
    event_date: '2026-11-07',
    start_time: '08:00:00',
    end_time: '14:30:00',
    tier: 'tier_1',
    color: 'red',
    is_inamovible: true,
    difficulty_score: 5,
    classroom_coursework_id: null,
    created_from: 'template',
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
  });

  return events;
}

export function generateRealNotes(): NoteItem[] {
  return [
    {
      id: 'note-1',
      title: 'Fórmulas Clave de Límites y Continuidad UTN',
      content_markdown: '• L’Hôpital: aplicable si 0/0 o inf/inf.\n• Asíntotas horizontales: lim x->inf f(x).\n• Asíntotas verticales: raíces del denominador.\n• Repasar factorización y binomio de Newton.',
      category_tag: '#utn',
      linked_date: '2026-10-04',
      linked_event_id: 'ev-utn-cursada',
      is_completed: false,
      synced_to_drive: true,
      drive_file_id: '1I2jPluS5gWPY8xJGqufea5tfC7Sgo17Q',
      created_at: '2026-10-04T09:30:00Z',
      updated_at: '2026-10-04T09:30:00Z',
    },
    {
      id: 'note-2',
      title: 'Materiales Dibujo Técnico: Formato A3',
      content_markdown: '• Comprar hojas Romani A3 con recuadro normalizado.\n• Cargar tinta china negra recargable 0.2 y 0.5.\n• Revisar escuadras de 45° y 60° sin bisel.',
      category_tag: '#dibujo',
      linked_date: '2026-10-04',
      linked_event_id: null,
      is_completed: false,
      synced_to_drive: false,
      drive_file_id: null,
      created_at: '2026-10-04T10:15:00Z',
      updated_at: '2026-10-04T10:15:00Z',
    },
    {
      id: 'note-3',
      title: 'Idea: Asistente de Estudio Multimodal con Gemini 2.0',
      content_markdown: 'Sacar foto al pizarrón de la UTN con Telegram -> Gemini extrae fórmulas LaTeX -> guardar directo en Supabase y Drive para que NotebookLM genere flashcards.',
      category_tag: '#ideas',
      linked_date: null,
      linked_event_id: null,
      is_completed: false,
      synced_to_drive: false,
      drive_file_id: null,
      created_at: '2026-10-03T18:00:00Z',
      updated_at: '2026-10-03T18:00:00Z',
    },
    {
      id: 'note-4',
      title: 'Lectura Devocional: Proverbios 3:5-6',
      content_markdown: '"Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia. Reconócelo en todos tus caminos, y él enderezará tus veredas."',
      category_tag: '#devocional',
      linked_date: '2026-10-04',
      linked_event_id: null,
      is_completed: true,
      synced_to_drive: false,
      drive_file_id: null,
      created_at: '2026-10-04T07:15:00Z',
      updated_at: '2026-10-04T07:15:00Z',
    },
  ];
}
