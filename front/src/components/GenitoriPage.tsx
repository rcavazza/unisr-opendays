import React, { useState } from 'react'
export const GenitoriPage = () => {
  const [selectedTime, setSelectedTime] = useState<string>('01:30 PM')
  return (
    <main className="min-h-screen bg-[#00A4E4] w-full text-white">
      <div className="max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-6xl font-viridian text-white tracking-wide leading-tight text-center mb-16">
          Welcome to Open Days
        </h1>
        <div className="bg-[#0082b6] rounded-lg p-6 mb-8 text-center ">
          <p className="text-lg font-normal leading-relaxed">
            Join us for an exciting Open Day at our Medical University! This is
            your opportunity to experience hands-on medical training and explore
            our facilities. Each activity has limited seats available, so we
            recommend registering early for your preferred sessions. Select the
            activities you're interested in and choose your preferred time slot
            to secure your spot.
          </p>
        </div>
        <div className="bg-[#0082b6] rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Genitori</h2>
              <p className="text-lg text-white/80">Tonte Mucche</p>
            </div>
            <div className="text-yellow-300 font-medium">
              {selectedTime === '01:30 PM' && '(Booked: 01:30 PM)'}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <span className="text-yellow-300 font-medium">Location:</span>{' '}
              <span>Room 101</span>
            </div>
            <div>
              <span className="text-yellow-300 font-medium">Duration:</span>{' '}
              <span>45 minutes</span>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-yellow-300 font-medium mb-2">
              Available Time Slots:
            </h3>
            <label className="flex items-center space-x-3 p-2 rounded hover:bg-white/5">
              <input
                type="radio"
                name="timeSlot"
                value="10:30 AM"
                checked={selectedTime === '10:30 AM'}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="h-4 w-4 text-yellow-300 border-white/30"
              />
              <span>10:30 AM</span>
              <span className="text-white/70">(6 spots available)</span>
            </label>
            <label className="flex items-center space-x-3 p-2 rounded hover:bg-white/5">
              <input
                type="radio"
                name="timeSlot"
                value="01:30 PM"
                checked={selectedTime === '01:30 PM'}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="h-4 w-4 text-yellow-300 border-white/30"
              />
              <span>01:30 PM</span>
              <span className="text-white/70">(4 spots available)</span>
            </label>
          </div>
          {selectedTime && (
            <div className="mt-4 bg-white/10 p-3 rounded-md">
              <p className="text-yellow-300 text-sm">
                You're registered for the {selectedTime} session
              </p>
            </div>
          )}
        </div>
        <div className="flex justify-center mb-16">
        <div className="flex justify-center mb-16">
        <button className="bg-yellow-300 text-white font-bold text-xl px-16 py-4 rounded-full border-2 border-white hover:bg-yellow-400 transition-colors">
        Submit
        </button>
        </div>
        </div>
        <div className="flex justify-center">
          <img
            src="https://uploadthingy.s3.us-west-1.amazonaws.com/w1w55NpM45wFShyM85TXCC/Group_96.svg"
            alt="UniSR Logo"
            className="h-16"
          />
        </div>
      </div>
    </main>
  )
}
