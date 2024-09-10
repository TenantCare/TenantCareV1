"use client"
import { signIn, useSession } from "next-auth/react"
import { SecondaryButton } from "./Button"
import Register from "../auth/register/page"
import { useRouter } from "next/navigation"

export const Hero = () => {
    const session = useSession()
    const router = useRouter()
    return <div>
        <div className="text-6xl font-medium">
            <span className="text-3xl">We care for you @</span>
            <span className="text-3xl text-blue-500">Tenantcare </span>
        </div>
        <div >
            <span className="text-3xl text-slate-400 flex justify-center  ">We are here to help you</span>
        </div>
        <div className="flex justify-center py-2">
            {!session.data?.user && (
                <button
                    className="px-2 py-1 bg-black text-white rounded-md"
                    onClick={() => {
                        console.log("Sign up button clicked");
                        router.push("/auth/register");
                    }}
                    prefix=" "
                >
                    Sign Up
                </button>
            )}
        </div>
    </div>
}