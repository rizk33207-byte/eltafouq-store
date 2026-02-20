export type Grade = "g1" | "g2" | "g3";
export type BookLanguage = "ar" | "en";
export type Subject = "bio" | "phy" | "chem";

export interface Book {
  id: string;
  title: string;
  grade: Grade;
  language: BookLanguage;
  subject: Subject;
  price: number;
  description: string;
  image: string;
  featured?: boolean;
}

export interface BookFilters {
  grade?: Grade;
  lang?: BookLanguage;
  subject?: Subject;
}

export const gradeValues: Grade[] = ["g1", "g2", "g3"];
export const languageValues: BookLanguage[] = ["ar", "en"];
export const subjectValues: Subject[] = ["bio", "phy", "chem"];

export const books: Book[] = [
  {
    id: "bio-g3-ar-01",
    title: "التفوق في الأحياء - الصف الثالث الثانوي (عربي)",
    grade: "g3",
    language: "ar",
    subject: "bio",
    price: 120,
    description:
      "شرح منهجي شامل مع أسئلة تدريبية متدرجة ونماذج امتحانات مطابقة للمواصفات الحديثة.",
    image: "/images/book-placeholder.svg",
    featured: true,
  },
  {
    id: "bio-g3-en-01",
    title: "El Tafouk Biology - Third Secondary (English)",
    grade: "g3",
    language: "en",
    subject: "bio",
    price: 135,
    description:
      "Comprehensive syllabus coverage with bilingual terminology and exam-style practice.",
    image: "/images/book-placeholder.svg",
    featured: true,
  },
  {
    id: "phy-g3-ar-01",
    title: "التفوق في الفيزياء - الصف الثالث الثانوي (عربي)",
    grade: "g3",
    language: "ar",
    subject: "phy",
    price: 125,
    description:
      "تدريبات مكثفة على الأفكار الصعبة مع بنك أسئلة متنوع وتلخيصات لكل وحدة.",
    image: "/images/book-placeholder.svg",
    featured: true,
  },
  {
    id: "chem-g3-ar-01",
    title: "التفوق في الكيمياء - الصف الثالث الثانوي (عربي)",
    grade: "g3",
    language: "ar",
    subject: "chem",
    price: 118,
    description:
      "محتوى منظم يركز على الفهم العميق للتفاعلات مع نماذج محلولة خطوة بخطوة.",
    image: "/images/book-placeholder.svg",
  },
  {
    id: "chem-g3-en-01",
    title: "El Tafouk Chemistry - Third Secondary (English)",
    grade: "g3",
    language: "en",
    subject: "chem",
    price: 132,
    description:
      "Modern layout with clear concept maps, worked examples, and exam-focused tasks.",
    image: "/images/book-placeholder.svg",
    featured: true,
  },
  {
    id: "bio-g2-ar-01",
    title: "التفوق في الأحياء - الصف الثاني الثانوي (عربي)",
    grade: "g2",
    language: "ar",
    subject: "bio",
    price: 105,
    description:
      "تدرج تعليمي واضح من الأساسيات إلى المهارات العليا مع مراجعات دورية ذكية.",
    image: "/images/book-placeholder.svg",
  },
  {
    id: "phy-g2-ar-01",
    title: "التفوق في الفيزياء - الصف الثاني الثانوي (عربي)",
    grade: "g2",
    language: "ar",
    subject: "phy",
    price: 110,
    description:
      "تطبيقات عملية وتمارين قياسية تساعد الطالب على سرعة الفهم وحل المسائل بثقة.",
    image: "/images/book-placeholder.svg",
    featured: true,
  },
  {
    id: "phy-g2-en-01",
    title: "El Tafouk Physics - Second Secondary (English)",
    grade: "g2",
    language: "en",
    subject: "phy",
    price: 122,
    description:
      "Concept-first approach with practical examples and progressive question banks.",
    image: "/images/book-placeholder.svg",
  },
  {
    id: "chem-g2-en-01",
    title: "El Tafouk Chemistry - Second Secondary (English)",
    grade: "g2",
    language: "en",
    subject: "chem",
    price: 119,
    description:
      "Built for mastery with chapter recaps, unit checkpoints, and final revision tests.",
    image: "/images/book-placeholder.svg",
  },
  {
    id: "bio-g1-ar-01",
    title: "التفوق في الأحياء - الصف الأول الثانوي (عربي)",
    grade: "g1",
    language: "ar",
    subject: "bio",
    price: 96,
    description:
      "مدخل قوي للمادة بأسلوب مبسط ورسومات توضيحية وأسئلة قصيرة بعد كل درس.",
    image: "/images/book-placeholder.svg",
  },
  {
    id: "phy-g1-en-01",
    title: "El Tafouk Physics - First Secondary (English)",
    grade: "g1",
    language: "en",
    subject: "phy",
    price: 102,
    description:
      "Student-friendly progression with foundational theory and practical assessments.",
    image: "/images/book-placeholder.svg",
  },
  {
    id: "chem-g1-ar-01",
    title: "التفوق في الكيمياء - الصف الأول الثانوي (عربي)",
    grade: "g1",
    language: "ar",
    subject: "chem",
    price: 98,
    description:
      "أساس متين للمفاهيم الكيميائية مع اختبارات تدريبية وخرائط ذهنية منظمة.",
    image: "/images/book-placeholder.svg",
  },
];

const normalizeParam = (
  value: string | string[] | undefined,
): string | undefined => {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && value.length > 0) {
    return value[0];
  }

  return undefined;
};

export const isGrade = (value: string | null | undefined): value is Grade =>
  value !== null && gradeValues.includes(value as Grade);

export const isBookLanguage = (
  value: string | null | undefined,
): value is BookLanguage =>
  value !== null && languageValues.includes(value as BookLanguage);

export const isSubject = (value: string | null | undefined): value is Subject =>
  value !== null && subjectValues.includes(value as Subject);

export const parseBookFilters = (
  searchParams: Record<string, string | string[] | undefined>,
): BookFilters => {
  const gradeRaw = normalizeParam(searchParams.grade);
  const langRaw = normalizeParam(searchParams.lang);
  const subjectRaw = normalizeParam(searchParams.subject);

  const grade = isGrade(gradeRaw) ? gradeRaw : undefined;
  const lang = grade && isBookLanguage(langRaw) ? langRaw : undefined;
  const subject = grade && lang && isSubject(subjectRaw) ? subjectRaw : undefined;

  return {
    ...(grade ? { grade } : {}),
    ...(lang ? { lang } : {}),
    ...(subject ? { subject } : {}),
  };
};

export const filterBooks = (filters: BookFilters): Book[] =>
  books.filter((book) => {
    if (filters.grade && book.grade !== filters.grade) {
      return false;
    }

    if (filters.lang && book.language !== filters.lang) {
      return false;
    }

    if (filters.subject && book.subject !== filters.subject) {
      return false;
    }

    return true;
  });

export const getFeaturedBooks = (limit = 6): Book[] =>
  books.filter((book) => book.featured).slice(0, limit);

export const getBookById = (id: string): Book | undefined =>
  books.find((book) => book.id === id);
