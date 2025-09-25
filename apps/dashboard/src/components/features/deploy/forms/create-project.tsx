import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const ProjectSchema = z.object({
  name: z
    .string()
    .min(3, { error: "Project Name must be more then 3 characters" }),
  desc: z.optional(z.string()),
});

type IProjectSchema = z.infer<typeof ProjectSchema>;

export function CreateProjectForm() {
  const form = useForm<IProjectSchema>({
    resolver: zodResolver(ProjectSchema),
    defaultValues: {
      name: "",
      desc: "",
    },
  });

  const onSubmit = (values: IProjectSchema) => {
    console.log({ values });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name</FormLabel>
              <FormControl>
                <Input placeholder="Project Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="desc"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Project Description"
                  {...field}
                  rows={5}
                  className="resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button className="w-full">Create Project</Button>
      </form>
    </Form>
  );
}
