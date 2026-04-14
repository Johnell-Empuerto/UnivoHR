import LoginForm from "../components/LoginForm";
import { Helmet } from "react-helmet-async";

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Helmet>
        <title>Login | HRMS</title>
      </Helmet>
      <LoginForm />
    </div>
  );
};

export default Login;
