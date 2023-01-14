import { useRouter } from 'next/router';
import Layout from "@/components/layout";
import MeetingAccept from '@/components/meetingaccept';

export default function MtgAccept() {
    const router = useRouter();
    const { token, email } = router.query;

    return (
        <div className="container">
           <Layout>
               <MeetingAccept token={token as string} email={email as string} />
           </Layout>
        </div>   
    );
}    