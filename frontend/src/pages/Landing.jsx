import React from 'react'
import {motion} from 'framer-motion'
import logo from '../assets/logo.png'
import Navbar from '../components/Navbar';
import '../App.css'
export default function Landing(){

  return (
    <motion.div
    className='w-[100vw] min-h-[100vh] bg-white'>

    {/* Navbar */}
    <div className='h-[12vh] w-[100vw] px-4 md:px-16 bg-lightBg'>
        <Navbar/>
    </div>

    <div 
    className='bg-landing flex justify-center md:justify-start items-center 
    w-full h-[88vh] 
    px-4 md:px-20 '>
        {/* Hero */}
        <div 
        className='h-auto w-[90%] md:h-[80%] md:w-[60%]
        bg-lightBg rounded-xl bg-opacity-70
        p-6 md:p-10'>
            <div className='w-full h-[30%] md:h-[40%] mb-4'>
                <h1 className='text-2xl md:text-[3.4rem] leading-snug 
                font-bold text-primary'>Empowering farmers with    
                    data-backed financial support
                </h1>
            </div>
            <div className='w-full md:w-[80%] h-[30%] mb-6'>
                <p className='text-xs md:text-[1.2rem] leading-snug font-bold text-darkBg'>
                Empowering farmers with comprehensive, data-driven yield prediction reports, 
                streamlining the loan approval process through transparency, accountability, 
                and visually engaging infographics that build trust and ease financial transactions.
                </p>
            </div>
            <div className='w-full h-[20%] flex items-center mb-4'>
                <button 
                className='px-4 py-2 md:px-10 md:py-3
                bg-accent text-sm md:text-xl text-darkBg 
                rounded-lg font-bold mr-2'>Get started</button>
                <button 
                className='px-4 py-2 md:px-10 md:py-3 
                bg-darkBg text-sm md:text-xl text-white 
                rounded-lg font-bold ml-2'>Learn more</button>
            </div>
        </div>
    </div>
    </motion.div>
  );
};
