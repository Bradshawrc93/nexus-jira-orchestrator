"use client";

import { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import { FaLinkedin, FaGithub } from "react-icons/fa";
import Link from "next/link";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <>
      <header className="glass-panel sticky top-0 z-50">
        <div className="nexus-container">
          <div className="flex items-center justify-between py-4">
            {/* BRANDING */}
            <div className="nexus-nav-brand">
              <div className="nexus-nav-icon shadow-glow">
                <span className="material-symbols-outlined">dataset</span>
              </div>
              <span className="text-white">Cody Bradshaw</span>
            </div>

            {/* MENU TRIGGER */}
            <button onClick={toggleMenu} className="nexus-nav-menu-btn">
              <FiMenu className="text-2xl" />
            </button>
          </div>
        </div>
      </header>

      {/* SLIDE-OUT DRAWER */}
      <div className={`fixed inset-0 z-[60] transition-all duration-300 ${isOpen ? 'visible' : 'invisible'}`}>
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
          onClick={toggleMenu} 
        />
        
        {/* Drawer Panel */}
        <div className={`nexus-drawer ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="h-full flex flex-col">
            {/* DRAWER HEADER */}
            <div className="nexus-drawer-header">
              <h3>Menu</h3>
              <button onClick={toggleMenu} className="text-text-muted hover:text-white transition-colors">
                <FiX className="text-2xl" />
              </button>
            </div>

            {/* NAV LINKS */}
            <nav className="flex-1 flex flex-col p-6 gap-6">
              <Link href="#" className="nexus-nav-link">
                <span className="material-symbols-outlined">download</span>
                Resume
              </Link>
              
              <Link 
                href="https://www.linkedin.com/in/cody-bradshaw-41965017b/" 
                target="_blank" 
                className="nexus-nav-link"
              >
                <FaLinkedin className="text-xl" />
                LinkedIn
              </Link>

              <Link 
                href="https://github.com/Bradshawrc93" 
                target="_blank" 
                className="nexus-nav-link"
              >
                <FaGithub className="text-xl" />
                GitHub
              </Link>

              <Link href="#apps" className="nexus-nav-link">
                <span className="material-symbols-outlined">grid_view</span>
                Apps
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}
