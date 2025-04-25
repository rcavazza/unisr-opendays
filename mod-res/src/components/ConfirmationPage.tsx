import React from 'react';
interface SelectedActivity {
  activity?: string;
  course?: string;
  time?: string;
}
interface ConfirmationPageProps {
  activities: SelectedActivity[];
}
export const ConfirmationPage = ({
  activities
}: ConfirmationPageProps) => {
  return <main className="min-h-screen bg-[#00A4E4] w-full">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-6xl font-viridian text-white tracking-wide leading-tight text-center mb-12">
          Welcome to Open Days
        </h1>
        <div className="max-w-lg mx-auto">
          <div className="text-center text-white text-xl mb-8">
            You received this recap also by email
          </div>
          <div className="bg-white p-8 rounded-lg shadow-lg mb-12">
            <img src="/qr.png" alt="QR Code" className="w-full aspect-square object-contain" />
          </div>
          <div className="space-y-4 mb-16">
            {activities.map((activity, index) => <div key={index} className="bg-[#0082b6] p-6 rounded">
                <h2 className="text-xl text-white mb-2">{activity.activity}</h2>
                <div className="text-white/80">{activity.course}</div>
                <div className="flex justify-between mt-2">
                  <div className="text-yellow-300">Location: Room 101</div>
                  <div className="text-yellow-300">Duration: 45 minutes</div>
                </div>
                <div className="text-yellow-300 mt-2">
                  (Booked: {activity.time})
                </div>
              </div>)}
          </div>
          <div className="flex justify-center">
            <img src="/Group_96.svg" alt="UniSR Logo" className="h-16" />
          </div>
        </div>
      </div>
    </main>;
};