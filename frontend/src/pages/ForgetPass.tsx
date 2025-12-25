import React from 'react'
import { ForgetpassForm } from '@/components/forget-form'

const ForgetPass = () => {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10 absolute inset-0 z-0 bg-gradient-pattern">
        <div className="w-full max-w-sm md:max-w-4xl">
            <ForgetpassForm />
        </div>
    </div>
  )
}

export default ForgetPass
