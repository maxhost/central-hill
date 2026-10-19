import { IMAGE_MIMES, VIDEO_MIMES, LOTTIE_MIMES } from "@core/media/mime";
import { uuid } from "@core/validation/primitives";
import type { HomeContent } from "../schemas/home";
export function homeMediaReferences(c: HomeContent, og: string | null) {
 return [
 { path:"og_image_media_id",id:og,kind:"image" },
 { path:"hero.video_media_id",id:c.hero.video_media_id,kind:"video" },
 { path:"hero.poster_media_id",id:c.hero.poster_media_id,kind:"image" },
 { path:"guests_pitch.image_media_id",id:c.guests_pitch.image_media_id,kind:"mixed" },
 { path:"dual_cta.owner.image_media_id",id:c.dual_cta.owner.image_media_id,kind:"image" },
 { path:"dual_cta.guest.image_media_id",id:c.dual_cta.guest.image_media_id,kind:"image" },
 ].filter((r):r is typeof r & {id:string}=>Boolean(r.id));
}
export function homeMediaErrors(c:HomeContent,og:string|null,assets:ReadonlyMap<string,{mime:string}>) {
 const errors:Record<string,string>={};
 for(const ref of homeMediaReferences(c,og)) {
 const allowed:readonly string[]=ref.kind==="video"?VIDEO_MIMES:ref.kind==="mixed"?[...IMAGE_MIMES,...VIDEO_MIMES,...LOTTIE_MIMES]:IMAGE_MIMES;
 if(!uuid.safeParse(ref.id).success || !allowed.includes(assets.get(ref.id)?.mime ?? "")) errors[ref.path]="Select an uploaded file of the supported type.";
 }return errors;
}
