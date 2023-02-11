import Head from 'next/head';

export default function Layout({ children}: {children: JSX.Element}) {
    return (
        <>
           <Head>
             <title>Appointment Scheduler Application</title>
             <link rel="icon" href="/favicon.ico" />
             <meta
              name="description"
              content="Appointment Scheduler Application"
              />
             <meta name="og:title" content="Appointment Scheduler Application" />
             <meta
              property="og:description"
              content="Appointment Scheduler Application"
              />
           </Head>
           <main>
              {children}
           </main>   
        </>
    );
}


