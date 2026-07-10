"use client";

import { useState } from "react";
import Chapter1 from "../lessons/Chapter1";
import Chapter2 from "../lessons/Chapter2";
import Chapter3 from "../lessons/Chapter3";
import Chapter4 from "../lessons/Chapter4";
import Chapter5 from "../lessons/Chapter5";
import Chapter6 from "../lessons/Chapter6";
import Chapter7 from "../lessons/Chapter7";
import Chapter8 from "../lessons/Chapter8";



interface Module {
  id: string;
  badge: string;
  title: string;
  description: string;
  component: React.ComponentType;
}

export default function CurriculumDropdown() {
  // Ovdje mapiramo sve module i dodjeljujemo im njihove komponente
  const modules: Module[] = [
    {
      id: "ch1",
      badge: "CHAPTER 1",
      title: "Introduction to Answer Engine Optimization (AEO)",
      description: "Understand the fundamentals of Answer Engine Optimization and how the rise of AI-powered search is changing the way users discover information online. This module explains the difference between traditional SEO and AEO, how AI answer engines work at a high level, why semantic understanding matters, and why businesses need to optimize their websites for the next generation of search.",
      component: Chapter1,
    },

    {
      id: "ch2",
      badge: "CHAPTER 2",
      title: "Technical Foundations of AEO: Crawling, Rendering & AI Accessibility",
      description: "Learn how AI systems discover, access, and process website information. This module explains why technical website quality is the foundation of Answer Engine Optimization, covering crawling, rendering, HTML structure, server performance, accessibility, and how technical issues can impact AI visibility.",
      component: Chapter2,
    },

    {
      id: "ch3",
      badge: "CHAPTER 3",
      title: "AI Crawlers, Robots.txt & Website Accessibility",
      description: "Learn how AI crawlers access websites and why crawlability is a critical part of Answer Engine Optimization. This module covers AI bot identification, robots.txt configuration, firewall restrictions, server responses, crawl permissions, and common technical barriers that can prevent AI systems from discovering and understanding your content.",
      component: Chapter3,
    },

     {
      id: "ch4",
      badge: "CHAPTER 4",
      title: "Semantic HTML, Content Structure & Heading Architecture",
      description: "Learn how website structure influences how AI systems interpret and organize information. This module explains semantic HTML, heading hierarchy, DOM structure, content segmentation, accessibility elements, and best practices for creating pages that are easier for both users and AI systems to understand.",
      component: Chapter4,
    },

    {
      id: "ch5",
      badge: "CHAPTER 5",
      title: "Multimodal AI, Image Optimization & Visual Accessibility",
    description: "Explore how modern AI systems understand more than just text. This module explains multimodal AI capabilities, image interpretation, alt attributes, structured visual content, accessibility standards, and how websites can optimize images so they become easier for AI systems and users to understand.",
      component: Chapter5,
    },

    {
      id: "ch6",
      badge: "CHAPTER 6",
      title: "Structured Data, JSON-LD & Entity Optimization",
      description: "Learn how structured data helps search engines and AI systems better understand the meaning of your content. This module covers Schema.org vocabulary, JSON-LD implementation, entity optimization, Knowledge Graphs, brand disambiguation, and best practices for creating structured information that improves machine understanding.",
      component: Chapter6,
    },
    {
      id: "ch7",
      badge: "CHAPTER 7",
      title: "AI-Friendly Content Architecture & Information Formatting",
      description: "Learn how to structure content for both human readers and AI systems. This module covers information architecture, semantic writing, content chunking, question-and-answer formatting, lists, tables, entity-rich content, and techniques for creating original, machine-readable content that is easier for AI systems to interpret and reference.",
      component: Chapter7,
    },
    {
      id: "ch8",
      badge: "CHAPTER 8",
      title: "AEO Auditing, Performance Monitoring & Continuous Optimization",
      description: "Learn how to evaluate and maintain a website's readiness for AI-powered search. This module explains how to perform an AEO audit, prioritize technical and content improvements, monitor website health over time, interpret audit results, and establish an ongoing optimization process that supports long-term AI visibility.",
      component: Chapter8,
    },
    // Ovdje ćeš dodati CH 2, CH 3, CH 4 na isti način kada napraviš fajlove:
    // { id: "ch2", badge: "CH 2", title: "Crawler Operations...", description: "...", component: Chapter2 }
  ];

  // Držimo ID otvorenog modula. Ako je null, svi su zatvoreni.
  const [activeModule, setActiveModule] = useState<string | null>(null);

  const toggleModule = (id: string) => {
    setActiveModule(activeModule === id ? null : id);
  };

  return (
    <div className="space-y-4 w-full">
      {modules.map((mod) => {
        const IsOpen = activeModule === mod.id;
        const LessonComponent = mod.component;

        return (
          <div 
            key={mod.id} 
            className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden transition-all duration-200"
          >
            {/* Klikabilno zaglavlje modula */}
            <button
              onClick={() => toggleModule(mod.id)}
              className="w-full text-left p-6 flex gap-4 items-start hover:bg-slate-50/50 transition-colors focus:outline-none"
            >
              <span className="font-black text-blue-600 bg-blue-50 text-xs px-2 py-1 rounded shrink-0">
                {mod.badge}
              </span>
              <div className="flex-1">
                <div className="flex justify-between items-center w-full">
                  <h4 className="font-bold text-sm sm:text-base text-slate-800 transition-colors hover:text-blue-600">
                    {mod.title}
                  </h4>
                  {/* Strelica ikonica koja se rotira zavisno od toga da li je otvoreno */}
                  <span className={`text-slate-400 text-xs transition-transform duration-200 ${IsOpen ? "rotate-180" : ""}`}>
                    ▲
                  </span>
                </div>
                <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-3xl">
                  {mod.description}
                </p>
              </div>
            </button>

            {/* Sadržaj modula koji se renderuje i širi samo kada je otvoren */}
            {IsOpen && (
              <div className="border-t border-slate-100 p-6 bg-slate-50/30">
                <LessonComponent />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}