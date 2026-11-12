const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React from "react";

const SDL_LOGO = `${import.meta.env.BASE_URL}logo.png`;

export default function NeuAuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* decorative blobs */}
      <div className="absolute top-10 -left-16 w-48 h-48 rounded-full sdl-gradient opacity-20 blur-3xl" />
      <div className="absolute bottom-10 -right-16 w-56 h-56 rounded-full bg-sdl-orange opacity-10 blur-3xl" />

      <div className="w-full max-w-md relative z-10 neu-fade-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="neu-card-sm p-3 rounded-3xl">
              <img src={SDL_LOGO} alt="SDL Logo" className="w-20 h-20 rounded-2xl object-cover" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sdl-gradient-text">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-2">{subtitle}</p>}
        </div>

        <div className="neu-card p-7">
          {children}
        </div>

        {footer && (
          <p className="text-center text-sm text-slate-500 mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}