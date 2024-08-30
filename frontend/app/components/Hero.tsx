"use client"
import { signIn, useSession } from "next-auth/react"
import { SeconndaryButton } from "./Button"

export const Hero = () => {
    const session = useSession()
    return <div>
        <div className="text-6xl font-medium">
            <span className="text-3xl">We care for you @</span>
            <span className="text-3xl text-blue-500">Tenantcare </span>
        </div>
        <div >
            <span className="text-3xl text-slate-400 flex justify-center  ">We are here to help you</span>
        </div>
        <div className="flex justify-center py-2">
            {!session.data?.user && <SeconndaryButton onClick={() => { signIn }} prefix=" "> Sign In With Google</SeconndaryButton>}
        </div>
    </div>
}