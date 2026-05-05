import { render, screen } from "@testing-library/react";
import PatientsPage from "../app/patients/page";

test("renders patients", () => {
  render(<PatientsPage />);
  expect(screen.getByText(/Patients/i)).toBeInTheDocument();
});