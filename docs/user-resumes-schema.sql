-- User Resumes Table
CREATE TABLE IF NOT EXISTS user_resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  summary TEXT,
  skills JSONB DEFAULT '[]'::jsonb,
  experience JSONB DEFAULT '[]'::jsonb,
  education JSONB DEFAULT '[]'::jsonb,
  file_path TEXT,
  file_name TEXT,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE user_resumes ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only access their own resumes
CREATE POLICY "Users can only access their own resumes" ON user_resumes
  FOR ALL USING (auth.uid() = user_id);

-- Create trigger for updated_at column
CREATE TRIGGER update_user_resumes_updated_at
  BEFORE UPDATE ON user_resumes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS user_resumes_user_id_idx ON user_resumes(user_id);

-- Sample insert for testing
INSERT INTO user_resumes (
  user_id,
  name,
  email,
  phone,
  summary,
  skills,
  experience,
  education
) VALUES (
  '00000000-0000-0000-0000-000000000000', -- Replace with a valid user ID
  'John Doe',
  'john.doe@example.com',
  '(555) 123-4567',
  'Experienced software developer with expertise in web technologies and cloud infrastructure.',
  '["JavaScript", "React", "Node.js", "AWS", "TypeScript", "SQL"]'::jsonb,
  '["Senior Developer at Tech Co. (2020-Present)", "Web Developer at StartupX (2018-2020)", "Junior Developer at CodeCorp (2016-2018)"]'::jsonb,
  '["Bachelor of Science in Computer Science, University of Technology (2016)"]'::jsonb
);

-- Note: The above insert is for testing purposes only.
-- In a production environment, you would insert data through your application. 