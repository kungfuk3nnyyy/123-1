
'use client'

import React from 'react'

interface HoneypotFieldsProps {
  onChange?: (field: string, value: string) => void
}

/**
 * Invisible bot trap fields (Layer 1 Security)
 * These fields are hidden from human users but visible to bots
 */
export function HoneypotFields({ onChange }: HoneypotFieldsProps) {
  const handleChange = (field: string, value: string) => {
    if (onChange) {
      onChange(field, value)
    }
  }

  return (
    <>
      {/* Hidden honeypot fields - positioned off-screen */}
      <div className="absolute -left-[9999px] opacity-0 pointer-events-none" aria-hidden="true">
        <input
          type="text"
          name="website"
          placeholder="Website"
          tabIndex={-1}
          autoComplete="off"
          onChange={(e) => handleChange('website', e.target.value)}
          style={{
            position: 'absolute',
            left: '-9999px',
            width: '1px',
            height: '1px',
            overflow: 'hidden'
          }}
        />
        <input
          type="url"
          name="url"
          placeholder="URL"
          tabIndex={-1}
          autoComplete="off"
          onChange={(e) => handleChange('url', e.target.value)}
          style={{
            position: 'absolute',
            left: '-9999px',
            width: '1px',
            height: '1px',
            overflow: 'hidden'
          }}
        />
        <input
          type="text"
          name="honeypot"
          placeholder="Leave this empty"
          tabIndex={-1}
          autoComplete="off"
          onChange={(e) => handleChange('honeypot', e.target.value)}
          style={{
            position: 'absolute',
            left: '-9999px',
            width: '1px',
            height: '1px',
            overflow: 'hidden'
          }}
        />
      </div>
      
      {/* Hidden timing field to track form load time */}
      <input
        type="hidden"
        name="formStartTime"
        value={Date.now().toString()}
      />
    </>
  )
}
