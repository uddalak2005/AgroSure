import React from 'react'

export default function CustomLoader({message}) {
  return (
    <div className='flex flex-col'>
          <div className={`w-12 h-12 border-4 border-green-400 border-t-transparent rounded-full animate-spin`}></div>
          <p className='text-gray-500 text-md mt-2'>{message}</p>
      </div>
  )
}
