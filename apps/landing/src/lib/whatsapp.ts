const PHONE = "2347033627804"; 

const DEFAULT_MESSAGE =
  "Hi RESTFit, I found your website and I'm interested in using your gym management software for my business. Can you tell me more?";

export function whatsappLink(message: string = DEFAULT_MESSAGE) {
  return `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;
}

export const WHATSAPP_PHONE = PHONE;
export const WHATSAPP_DEFAULT_MESSAGE = DEFAULT_MESSAGE;