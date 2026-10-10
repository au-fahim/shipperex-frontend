import type {Metadata} from "next";
import {SiteInfoPage} from "@/components/site-info-page";
export const metadata:Metadata={title:"About ShipperEx",description:"A thoughtful way to send important documents and parcels."};
export default function AboutPage(){return <SiteInfoPage kind="about"/>;}
