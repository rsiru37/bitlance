"use client";

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from "next-auth/react";
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { freelancerDetails, clientDetails, getUserJobs } from "@/config/apiconfig";
import { FreelancerData, ClientData } from '@/types/data-types';
import { useRouter } from 'next/navigation';
import { ConnectBtn } from '@/components/Connect';
import CreateJobModal from '@/components/ui/CreateJobModal';
import { Category, Status } from '@prisma/client';
import Link from 'next/link';

interface JobFreelancer {
  id: string;
  job_id: string;
  client_id: string;
  freelancer_id: string;
  freelancer_address: string;
  
  job: {
    job_id: string;
    title: string;
    created_at: Date;
    description: string;
    category: Category;
    client_address: string;
    freelancer_id: string | null;
    client_id: string;
    price: number | null;
    f_rating: number | null;
    c_rating: number | null;
    u_id: string;
    status: Status;
  };
}

const Dashboard: React.FC = () => {
  const { data: session } = useSession();
  const [isFreelancer, setIsFreelancer] = useState(true);
  const [freelancerData, setFreelancerData] = useState<FreelancerData | null>(null);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [userJobs, setUserJobs] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const userId = session?.user.data.user_id;

      if (userId) {
        try {
          if (isFreelancer) {
            const res = await freelancerDetails(userId);
            if (res?.data) {
              setFreelancerData(res.data);
              setErrorMessage(null);
            } else {
              setErrorMessage("User doesn't have a freelancer profile.");
            }
          } else {
            const res = await clientDetails(userId);
            if (res?.data) {
              setClientData(res.data);
              setErrorMessage(null);
            } else {
              setErrorMessage("User doesn't have a client profile.");
            }
          }
        } catch (error: any) {
          if (error.response && error.response.status === 400) {
            setErrorMessage(isFreelancer ? "User doesn't have a freelancer profile." : "User doesn't have a client profile.");
          } else {
            console.error("Failed to fetch data:", error);
            setErrorMessage("An error occurred. Please try again.");
          }
        }

        try {
          const jobs = await getUserJobs(userId, isFreelancer);
          console.log("User Jobs:", jobs);
          setUserJobs(jobs);
        } catch (error) {
          console.error("Failed to fetch user jobs:", error);
          setErrorMessage("Failed to fetch user jobs. Please try again.");
        }
      }
    };

    fetchData();
  }, [isFreelancer, session?.user.data.user_id]);

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: "/" });
  };

  const handleSwitchChange = (checked: boolean) => {
    setIsFreelancer(checked);
  };

  const handleBrowseJobs = () => {
    router.replace("/job");
  };

  return (
    <div className="min-h-screen flex flex-col bg-primaryBitlanceDark text-white">
      <header className="bg-primaryBitlanceDark p-4 shadow-lg flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl text-primaryBitlanceLightGreen font-bold">
          Welcome: {session?.user.data.email}
        </h1>
        <div className='w-1/4'><ConnectBtn /></div>

        <div className="flex items-center space-x-4">
          <span className="text-primaryBitlanceLightGreen">Client</span>
          <Switch checked={isFreelancer} onChange={handleSwitchChange} />
          <span className="text-primaryBitlanceLightGreen">Freelancer</span>
        </div>
      </header>
      <main className="flex-grow p-8 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <section className="bg-primaryBitlanceDark p-6 rounded-lg shadow-lg border border-primaryBitlanceLightGreen">
            <h2 className="text-xl md:text-2xl font-semibold text-primaryBitlanceLightGreen mb-4 text-center">User Information</h2>
            <p className="mb-2"><span className="font-bold">Username:</span> {session?.user.data.username}</p>
            <p className="mb-2"><span className="font-bold">Email:</span> {session?.user.data.email}</p>
            <p className="mb-2"><span className="font-bold">Name:</span> {session?.user.data.name}</p>
            <p className="mb-2"><span className="font-bold">Role:</span> {session?.user.data.role}</p>
          </section>
          <section className="bg-primaryBitlanceDark p-6 rounded-lg shadow-lg border border-primaryBitlanceLightGreen">
            <h2 className="text-xl md:text-2xl font-semibold text-primaryBitlanceLightGreen mb-4 text-center">{isFreelancer ? 'Freelancer Details' : 'Client Details'}</h2>
            {errorMessage ? (
              <p className="text-red-500">{errorMessage}</p>
            ) : (
              isFreelancer ? (
                freelancerData ? (
                  <div>
                    <p className="mb-2"><span className="font-bold">Bio:</span> {freelancerData.bio}</p>
                    <p className="mb-2"><span className="font-bold">Skills:</span> {freelancerData.skills}</p>
                    <p className="mb-2"><span className="font-bold">Portfolio Link:</span> {freelancerData.portfolio_link}</p>
                    <p className="mb-2"><span className="font-bold">Social Link:</span> {freelancerData.social_link}</p>
                  </div>
                ) : (
                  <p>Loading freelancer data...</p>
                )
              ) : (
                clientData ? (
                  <div>
                    <p className="mb-2"><span className="font-bold">Company Name:</span> {clientData.company_name}</p>
                    <p className="mb-2"><span className="font-bold">Company Description:</span> {clientData.company_description}</p>
                    <p className="mb-2"><span className="font-bold">Website Link:</span> {clientData.websiteLink}</p>
                  </div>
                ) : (
                  <p>Loading client data...</p>
                )
              )
            )}
          </section>
          <div className="mt-8 flex justify-center">
            <Button
              onClick={isFreelancer ? handleBrowseJobs : () => setIsJobModalOpen(true)}
              className="bg-primaryBitlanceLightGreen text-black font-semibold rounded-md hover:bg-primaryBitlanceGreen transition duration-300 px-6 py-2"
            >
              {isFreelancer ? 'Browse Jobs' : 'Create Job'}
            </Button>
          </div>
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-primaryBitlanceLightGreen mb-4 text-center">My Jobs</h2>
            {Array.isArray(userJobs) && userJobs.length === 0 ? (
              <p className="text-center">No jobs found.</p>
            ) : (
              <div className="flex flex-col items-center">
                <div className="max-h-[200px] overflow-y-auto w-full">
                  {userJobs.map((job: any, index: number) => (
                    <Link key={index} href={`/requests/${job.job_id}`} className="bg-primaryBitlanceDark p-4 rounded-lg shadow-lg border border-primaryBitlanceLightGreen mb-4 block">
                      <h3 className="text-lg text-center font-semibold text-primaryBitlanceLightGreen">{job.title}</h3>
                      <p className="text-center">{job.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <footer className="bg-primaryBitlanceDark p-4 text-center">
        <Button onClick={handleSignOut} className="bg-primaryBitlanceLightGreen text-black font-semibold rounded-md hover:bg-primaryBitlanceGreen transition duration-300 px-6 py-2">
          Sign Out
        </Button>
      </footer>
      {isJobModalOpen && <CreateJobModal user_id={session?.user.data.user_id || ""} clientId={clientData?.c_id || ""} isOpen={isJobModalOpen} onClose={() => setIsJobModalOpen(false)} />}
    </div>
  );
};

export default Dashboard;
