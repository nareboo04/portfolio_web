'use client'

import { createContext, useContext, useState } from 'react'

const ALL_SECTIONS = new Set([
  'about', 'certifications', 'infrastructure', 'projects', 'skills', 'timeline', 'activities', 'contact',
])

interface NavVisibilityContextType {
  visibleSections: Set<string>
  setVisibleSections: (sections: Set<string>) => void
  sectionOrder: string[]
  setSectionOrder: (order: string[]) => void
}

const NavVisibilityContext = createContext<NavVisibilityContextType>({
  visibleSections: ALL_SECTIONS,
  setVisibleSections: () => {},
  sectionOrder: [],
  setSectionOrder: () => {},
})

export function NavVisibilityProvider({ children }: { children: React.ReactNode }) {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(ALL_SECTIONS)
  const [sectionOrder, setSectionOrder] = useState<string[]>([])

  return (
    <NavVisibilityContext.Provider value={{ visibleSections, setVisibleSections, sectionOrder, setSectionOrder }}>
      {children}
    </NavVisibilityContext.Provider>
  )
}

export const useNavVisibility = () => useContext(NavVisibilityContext)
