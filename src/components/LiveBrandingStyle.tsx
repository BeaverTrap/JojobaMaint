import { createClient } from "@/lib/supabase/server";

const DEFAULTS = {
  brand_50: "#f1f7f2", brand_100: "#dcede0", brand_200: "#bbdcc3",
  brand_300: "#8fc29e", brand_400: "#5da176", brand_500: "#3d8459",
  brand_600: "#2d6a47", brand_700: "#25553a", brand_800: "#204430",
  brand_900: "#1b3829", brand_950: "#0f1f17", gold: "#c0882c",
};

export default async function LiveBrandingStyle() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_branding")
    .select("brand_50,brand_100,brand_200,brand_300,brand_400,brand_500,brand_600,brand_700,brand_800,brand_900,brand_950,gold")
    .eq("id", "default")
    .maybeSingle();

  if (!data) return null;

  const isDefault = Object.entries(DEFAULTS).every(
    ([key, val]) => data[key as keyof typeof data] === val,
  );
  if (isDefault) return null;

  const css = `:root {
  --color-brand-50: ${data.brand_50};
  --color-brand-100: ${data.brand_100};
  --color-brand-200: ${data.brand_200};
  --color-brand-300: ${data.brand_300};
  --color-brand-400: ${data.brand_400};
  --color-brand-500: ${data.brand_500};
  --color-brand-600: ${data.brand_600};
  --color-brand-700: ${data.brand_700};
  --color-brand-800: ${data.brand_800};
  --color-brand-900: ${data.brand_900};
  --color-brand-950: ${data.brand_950};
  --color-gold: ${data.gold};
}`;

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
