import React from 'react'
import logo from "../assets/logo.png"

export default function Navbar() {
  return (
    <div className='h-full w-full flex justify-between'>
    <div className='h-full w-[20%] md:w-[5%] flex items-center'>
        <img src={logo} className='object-contain'/>
    </div>
    <div className='h-full hidden md:flex md:w-[30%]'>

    </div>

    <div className='h-full w-[60%] md:w-[30%] flex justify-center items-center'>
        <button className='bg-primary text-white 
        text-sm rounded-md px-3 py-2 m-2 font-bold
        md:font-bold md:text-lg 
        md:px-10 md:rounded-md md:py-2 
        md:m-4'>Sign up</button>
        <button className='bg-primary text-white 
        text-sm rounded-md px-3 py-2 m-2 font-bold
        md:font-bold md:text-lg 
        md:px-10 md:rounded-md md:py-2 
        md:m-4'>Sign in</button>
    </div>

    </div>

  )
}

