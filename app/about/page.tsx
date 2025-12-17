"use cache";

import Image from "next/image";

export default async function AboutPage() {
  return (
    <div className="p-6 md:p-10 mt-10 flex flex-col space-y-12 md:space-y-16 items-center justify-center">
      <div className="w-full md:w-3/4 lg:w-1/2 text-center">
        {" "}
        <h1 className="text-3xl md:text-4xl font-bold">Remindly</h1>
        <p className="text-muted-foreground mt-2 tracking-wide leading-relaxed">
          Remindly is a powerful yet intuitive task reminder application
          designed to help you stay organized and never miss important
          deadlines. Our smart reminder system allows you to create tasks, set
          timely notifications, organize by priority, and track your progress
          all in one place. Built with modern web technologies, Remindly offers
          a seamless experience across all your devices. As a free and open
          source project, we believe in providing accessible productivity tools
          to everyone, with our code available on GitHub for transparency and
          community contributions.
        </p>
      </div>

      <div className="w-full md:w-2/3 lg:w-1/2 flex flex-col justify-center items-center px-4">
        <h3 className="text-lg md:text-xl font-bold text-center">
          Currently Developed By
        </h3>
        <Image
          src="/images/ikalsama.png"
          alt="ikalsama"
          width={100}
          height={100}
          className="my-5"
        />
        <p className="text-center text-muted-foreground">Daniel Jhon Bancale</p>
      </div>
    </div>
  );
}
