import React from 'react'
import { AddFarmer } from '../components/Forms/addFarmerForm'
import { useAuth } from '../context/AuthContext';

export default function AddFarmerPage() {
    const { user, isloggedIn } = useAuth();
  return (
    <div className='flex flex-col lg:flex-row max-h-[100vh] bg-background w-[100vw] p-4'>
        <div className='flex flex-[1.5] max-h-[100vh] bg-background'>
        <AddFarmer/>
        </div>
        
        <div className='flex flex-[1] h-full bg-accent rounded-lg p-2 lg:p-6'>
            <div className='w-full h-full flex flex-col justify-left bg-gray-200 shadown-sm rounded-lg p-4 lg:p-8'>
                <h1 className='text-xl font-bold text-accent-foreground mb-12'>Notification regarding farmer addition</h1>
                <p>
                    Please ensure that the farmer's details are accurate and complete before submitting the form. 
                    Once submitted, the farmer will be registered under your jurisdiction and can start using the services provided.
                    If you have any questions or need assistance, please contact your system administrator.
                    <br/><br/>
                    <strong>Note:</strong> It is important to keep the farmer's information up-to-date to ensure smooth operations
                    and effective communication. Regularly review and update the farmer's details as necessary.
                    <br/><br/>

                    Thank you for your cooperation in maintaining accurate records and supporting our agricultural community.
                </p>

                <div className='flex flex-col justify-left mt-8 bg-accent/50 p-4 rounded-lg'>
                    <h1 className='text-base font-bold text-accent-foreground mb-6'>
                        Farmer Shall be added under the following manager:
                    </h1>
                    <p className='text-sm text-muted-foreground'>
                        The farmer will be registered under the jurisdiction of the manager who is currently logged in.
                        Ensure that the manager's details are correct to facilitate proper management and support for the farmer.
                    </p>
                    <br></br>
                    <p className='text-base text-foreground'><strong>Name</strong> : {user.name}</p>
                    <p className='text-base text-foreground'><strong>Location</strong> : Place, State</p>
                </div>
            </div>
        </div>
    </div>
  )
}
