'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ProtectedRoute from '@/Components/ProtectedRoute';

export default function TicketInfo() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = ['/assets/img/33.png', '/assets/img/22.png', '/assets/img/11.png'];

  // Auto-slide functionality
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 9000);

    return () => clearInterval(slideInterval);
  }, []);

  // Sample data for display (static UI only)
  const counters = [
    { ticket: 'A001', counter: '1' },
    { ticket: 'A002', counter: '2' },
    { ticket: 'Break', counter: '3' },
    { ticket: 'A003', counter: '4' },
  ];

  return (
    <ProtectedRoute>
      <div className="flex flex-row h-screen w-full bg-white text-white font-sans overflow-hidden">
      {/* Left Panel: Counter Table */}
      <div className="flex-[0_0_30%] bg-green-700 flex flex-col border-r-[3px] border-[#fdbb2d] overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="bg-green-700 text-[38.4px] text-white text-center p-2 font-bold shadow-lg rounded-lg">
                Ticket
              </th>
              <th className="bg-green-700 text-[38.4px] text-white text-center p-2 font-bold shadow-lg rounded-lg">
                Counter
              </th>
            </tr>
          </thead>
          <tbody>
            {counters.map((item, index) => (
              <tr key={index} className="border-b-1 border-[#e6e9ec]">
                <td className="bg-white text-black text-[60px] text-center align-middle lg:text-[4vw] md:text-[5vw] sm:text-[7vw]">
                  {item.ticket}
                </td>
                <td className="bg-white text-black text-[60px] text-center align-middle lg:text-[3vw] md:text-[5vw] sm:text-[7vw]">
                  {item.counter}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Right Panel: Header, Slider, and News Ticker */}
      <div className="flex-[0_0_70%] flex flex-col">
        {/* Header Section */}
        <div className="w-full flex justify-around items-center bg-white/95 shadow-lg h-[200px] border-b border-gray-300">
          <div className="flex-[0_0_25%] text-center">
            <img
              src="https://ded.techsolutionor.com/assets/img/logo/DEDpreview.png"
              alt="Logo"
              className="w-[150px] h-[100px] mx-auto"
            />
          </div>
          <div className="flex-[0_0_50%] text-center border-l-[5px] border-r-[5px] border-gray-300">
            <div className="text-black font-bold text-[40px]">
              <b className="text-red-600 text-[50px]">Now Calling</b>
              <br />
              <span className="text-[50px] font-bold">A001</span>
              <span className="inline-block w-[50px] h-[6px] bg-black align-middle mx-2"></span>
              <span className="text-[50px] font-bold">1</span>
            </div>
          </div>
          <div className="flex-[0_0_25%] text-right">
            <img
              src="https://epbc.techsolutionor.com/assets/img/logo/image-removebg-preview.png"
              alt="Logo"
              className="w-[200px] h-auto mr-8 mb-1"
            />
          </div>
        </div>

        {/* Image Slider */}
        <div className="relative w-full h-[calc(100%-15vh)] rounded-lg overflow-hidden mb-0">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img src={slide} alt={`Slide ${index + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        {/* News Ticker */}
        <div className="w-full bg-[#333] text-white p-4 text-center text-[3vh] font-bold h-[8vh] flex items-center justify-center">
          <marquee>Welcome to Dubai Economic Department Services</marquee>
        </div>
      </div>

      {/* Responsive Styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          .flex-[0_0_30%] {
            flex: 0 0 100%;
            height: auto;
            overflow-y: auto;
          }
          .flex-[0_0_70%] {
            display: none;
          }
        }
      `}</style>
    </div>
    </ProtectedRoute>
  );
}
