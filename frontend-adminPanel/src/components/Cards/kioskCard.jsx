import React from 'react'

export default function KioskCard(props) {
    const { manager, place, state, id, farmers, claims, pending, status, online } = props.kiosk;
  return (
    <div className='max-h-[22vh] w-[100%] rounded-lg bg-white flex flex-col
     gap-2 justify-center p-2 hover:scale-105 transition-smooth'>
        <div className='w-full flex flex-col flex-[2] bg-accent/30 rounded-lg p-3 relative'>

            <div className='w-[40%] h-5 rounded-lg
             absolute top-2 right-2 flex flex-row gap-2'>
                    <div className={`h-[100%] rounded-lg flex flex-[1] items-center justify-center 
                ${status === 'Active' ? 'bg-green-300 text-green-800' : 'bg-amber-600 text-red-800'}`}>
                        <p className='text-xs font-bold text-green-800'>{status}</p>
                    </div>
                    <div className={`h-[100%] rounded-lg flex flex-[1] items-center justify-center 
                ${online ? 'bg-green-300 text-green-800' : 'bg-amber-500 text-red-800'}`}>
                        <p className='text-xs font-bold'>{online ? 'Online' : 'Closed'}</p>
                    </div>
            </div>

            <h1 className='text-base font-bold text-foreground max-w-[50%] flex-wrap'>{manager}</h1>
            <p className='text-sm text-muted-foreground'>{place}, {state}</p>
        </div>
        <div className='w-full flex flex-[1] rounded-lg p-4'>
            <div className='w-full grid grid-cols-2 gap-2'>
                <h1 className='text-xs font-bold text-foreground'>Kiosk ID : {id}</h1>
                <h1 className='text-xs font-bold text-foreground'>Undrtaken farmers : {farmers}</h1>
                <h1 className='text-xs font-bold text-foreground'>Total Claims : {claims}</h1>
                <h1 className='text-xs font-bold text-foreground'>Pending Claims : {pending}</h1>
            </div>
        </div>
    </div>
  )
}
