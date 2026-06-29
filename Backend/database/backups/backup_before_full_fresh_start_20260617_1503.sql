--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8
-- Dumped by pg_dump version 16.8

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: anomaly_severity; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.anomaly_severity AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH'
);


ALTER TYPE public.anomaly_severity OWNER TO postgres;

--
-- Name: anomaly_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.anomaly_status AS ENUM (
    'OPEN',
    'REVIEWED',
    'RESOLVED'
);


ALTER TYPE public.anomaly_status OWNER TO postgres;

--
-- Name: smtp_encryption; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.smtp_encryption AS ENUM (
    'tls',
    'ssl',
    'none'
);


ALTER TYPE public.smtp_encryption OWNER TO postgres;

--
-- Name: check_time_overlap(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_time_overlap() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  overlap_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM man_hour_report_details
    WHERE report_id = NEW.report_id
      AND id != COALESCE(NEW.id, -1)
      AND (
        (NEW.time_from, NEW.time_to) OVERLAPS (time_from, time_to)
      )
  ) INTO overlap_exists;
  
  IF overlap_exists THEN
    RAISE EXCEPTION 'Time ranges overlap within the same report';
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.check_time_overlap() OWNER TO postgres;

--
-- Name: prevent_audit_modification(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.prevent_audit_modification() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted';
END;
$$;


ALTER FUNCTION public.prevent_audit_modification() OWNER TO postgres;

--
-- Name: random_check_in(date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.random_check_in(date_val date) RETURNS timestamp without time zone
    LANGUAGE plpgsql
    AS $$
DECLARE
    hour INT;
    minute INT;
    second INT;
BEGIN
    -- 70% chance of on-time (before 8:00 AM), 30% chance of late
    IF random() < 0.7 THEN
        -- On time: 7:00 to 7:59
        hour := 7 + floor(random() * 1);
        minute := floor(random() * 60);
    ELSE
        -- Late: 8:00 to 9:00
        hour := 8 + floor(random() * 1);
        minute := floor(random() * 60);
    END IF;
    second := floor(random() * 60);
    RETURN date_val + (hour * interval '1 hour') + (minute * interval '1 minute') + (second * interval '1 second');
END;
$$;


ALTER FUNCTION public.random_check_in(date_val date) OWNER TO postgres;

--
-- Name: random_check_out(timestamp without time zone); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.random_check_out(check_in timestamp without time zone) RETURNS timestamp without time zone
    LANGUAGE plpgsql
    AS $$
DECLARE
    hour INT;
    minute INT;
BEGIN
    -- Check out between 5:00 PM and 6:30 PM
    hour := 17 + floor(random() * 2);
    minute := floor(random() * 60);
    RETURN DATE(check_in) + (hour * interval '1 hour') + (minute * interval '1 minute');
END;
$$;


ALTER FUNCTION public.random_check_out(check_in timestamp without time zone) OWNER TO postgres;

--
-- Name: update_anomaly_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_anomaly_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_anomaly_updated_at() OWNER TO postgres;

--
-- Name: update_employee_leave_balances_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_employee_leave_balances_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_employee_leave_balances_updated_at() OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _migration_020_repair_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._migration_020_repair_log (
    id integer NOT NULL,
    user_id integer NOT NULL,
    permission_key character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public._migration_020_repair_log OWNER TO postgres;

--
-- Name: _migration_020_repair_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public._migration_020_repair_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public._migration_020_repair_log_id_seq OWNER TO postgres;

--
-- Name: _migration_020_repair_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public._migration_020_repair_log_id_seq OWNED BY public._migration_020_repair_log.id;


--
-- Name: anomaly_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.anomaly_logs (
    id bigint NOT NULL,
    employee_id integer NOT NULL,
    branch_id integer,
    anomaly_type character varying(50) NOT NULL,
    source_module character varying(50) NOT NULL,
    severity public.anomaly_severity DEFAULT 'MEDIUM'::public.anomaly_severity NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    detected_value character varying(100),
    expected_value character varying(100),
    status public.anomaly_status DEFAULT 'OPEN'::public.anomaly_status NOT NULL,
    detected_at timestamp with time zone DEFAULT now() NOT NULL,
    reviewed_at timestamp with time zone,
    resolved_at timestamp with time zone,
    reviewed_by integer,
    resolved_by integer,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    anomaly_score numeric(10,4),
    confidence numeric(10,4),
    baseline_value character varying(100),
    statistical_method character varying(50)
);


ALTER TABLE public.anomaly_logs OWNER TO postgres;

--
-- Name: anomaly_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.anomaly_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.anomaly_logs_id_seq OWNER TO postgres;

--
-- Name: anomaly_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.anomaly_logs_id_seq OWNED BY public.anomaly_logs.id;


--
-- Name: applicant_approvals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.applicant_approvals (
    id integer NOT NULL,
    applicant_id integer NOT NULL,
    approved_by integer,
    approval_type character varying(100) NOT NULL,
    decision character varying(50) DEFAULT 'PENDING'::character varying NOT NULL,
    comments text,
    decided_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT applicant_approvals_decision_check CHECK (((decision)::text = ANY ((ARRAY['APPROVED'::character varying, 'REJECTED'::character varying, 'PENDING'::character varying])::text[])))
);


ALTER TABLE public.applicant_approvals OWNER TO postgres;

--
-- Name: applicant_approvals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.applicant_approvals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.applicant_approvals_id_seq OWNER TO postgres;

--
-- Name: applicant_approvals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.applicant_approvals_id_seq OWNED BY public.applicant_approvals.id;


--
-- Name: applicant_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.applicant_documents (
    id integer NOT NULL,
    applicant_id integer NOT NULL,
    document_type character varying(100) NOT NULL,
    file_url text NOT NULL,
    file_name character varying(255),
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.applicant_documents OWNER TO postgres;

--
-- Name: applicant_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.applicant_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.applicant_documents_id_seq OWNER TO postgres;

--
-- Name: applicant_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.applicant_documents_id_seq OWNED BY public.applicant_documents.id;


--
-- Name: applicant_education; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.applicant_education (
    id integer NOT NULL,
    applicant_id integer NOT NULL,
    education_level character varying(30) NOT NULL,
    school_name character varying(200) NOT NULL,
    course_or_degree character varying(200),
    year_started integer,
    year_graduated integer,
    honors_awards text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT applicant_education_education_level_check CHECK (((education_level)::text = ANY ((ARRAY['elementary'::character varying, 'high_school'::character varying, 'college'::character varying, 'masters'::character varying, 'doctorate'::character varying, 'vocational'::character varying, 'other'::character varying])::text[])))
);


ALTER TABLE public.applicant_education OWNER TO postgres;

--
-- Name: applicant_education_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.applicant_education_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.applicant_education_id_seq OWNER TO postgres;

--
-- Name: applicant_education_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.applicant_education_id_seq OWNED BY public.applicant_education.id;


--
-- Name: applicant_family_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.applicant_family_members (
    id integer NOT NULL,
    applicant_id integer NOT NULL,
    relationship_type character varying(30) NOT NULL,
    full_name character varying(150) NOT NULL,
    birthdate date,
    occupation character varying(150),
    contact_number character varying(30),
    address text,
    is_dependent boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT applicant_family_members_relationship_type_check CHECK (((relationship_type)::text = ANY ((ARRAY['spouse'::character varying, 'child'::character varying, 'father'::character varying, 'mother'::character varying, 'parent'::character varying, 'dependent'::character varying])::text[])))
);


ALTER TABLE public.applicant_family_members OWNER TO postgres;

--
-- Name: applicant_family_members_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.applicant_family_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.applicant_family_members_id_seq OWNER TO postgres;

--
-- Name: applicant_family_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.applicant_family_members_id_seq OWNED BY public.applicant_family_members.id;


--
-- Name: applicant_interviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.applicant_interviews (
    id integer NOT NULL,
    applicant_id integer NOT NULL,
    interview_date timestamp without time zone NOT NULL,
    interviewer character varying(255),
    interview_type character varying(100),
    notes text,
    rating numeric(5,2),
    status character varying(50) DEFAULT 'SCHEDULED'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    interviewer_user_id integer,
    recommendation character varying(20),
    CONSTRAINT applicant_interviews_recommendation_check CHECK (((recommendation IS NULL) OR ((recommendation)::text = ANY ((ARRAY['PASSED'::character varying, 'FAILED'::character varying, 'FOR_REVIEW'::character varying])::text[])))),
    CONSTRAINT applicant_interviews_status_check CHECK (((status)::text = ANY ((ARRAY['SCHEDULED'::character varying, 'COMPLETED'::character varying, 'CANCELLED'::character varying, 'RESCHEDULED'::character varying])::text[])))
);


ALTER TABLE public.applicant_interviews OWNER TO postgres;

--
-- Name: applicant_interviews_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.applicant_interviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.applicant_interviews_id_seq OWNER TO postgres;

--
-- Name: applicant_interviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.applicant_interviews_id_seq OWNED BY public.applicant_interviews.id;


--
-- Name: applicant_requirements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.applicant_requirements (
    id integer NOT NULL,
    applicant_id integer NOT NULL,
    requirement_name character varying(150) NOT NULL,
    status character varying(30) DEFAULT 'Pending'::character varying,
    remarks text,
    submitted_date date,
    verified_date date,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT applicant_requirements_status_check CHECK (((status)::text = ANY ((ARRAY['Pending'::character varying, 'Completed'::character varying, 'Rejected'::character varying])::text[])))
);


ALTER TABLE public.applicant_requirements OWNER TO postgres;

--
-- Name: applicant_requirements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.applicant_requirements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.applicant_requirements_id_seq OWNER TO postgres;

--
-- Name: applicant_requirements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.applicant_requirements_id_seq OWNED BY public.applicant_requirements.id;


--
-- Name: applicant_stage_approvals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.applicant_stage_approvals (
    id integer NOT NULL,
    applicant_id integer NOT NULL,
    stage_record_id integer NOT NULL,
    workflow_stage_id integer NOT NULL,
    approver_employee_id integer,
    approval_level integer DEFAULT 1,
    decision character varying(50) DEFAULT 'PENDING'::character varying,
    comments text,
    decided_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    assigned_user_id integer,
    assigned_employee_id integer,
    scheduled_at timestamp without time zone,
    assigned_at timestamp without time zone,
    assigned_by integer,
    CONSTRAINT chk_stage_approval_decision CHECK (((decision)::text = ANY ((ARRAY['PENDING'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying, 'SKIPPED'::character varying])::text[])))
);


ALTER TABLE public.applicant_stage_approvals OWNER TO postgres;

--
-- Name: applicant_stage_approvals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.applicant_stage_approvals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.applicant_stage_approvals_id_seq OWNER TO postgres;

--
-- Name: applicant_stage_approvals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.applicant_stage_approvals_id_seq OWNED BY public.applicant_stage_approvals.id;


--
-- Name: applicant_stage_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.applicant_stage_records (
    id integer NOT NULL,
    applicant_id integer NOT NULL,
    workflow_instance_id integer NOT NULL,
    workflow_stage_id integer NOT NULL,
    stage_name character varying(150) NOT NULL,
    stage_type character varying(50) NOT NULL,
    assigned_user_id integer,
    assigned_employee_id integer,
    status character varying(50) DEFAULT 'PENDING'::character varying,
    score numeric(5,2),
    recommendation character varying(50),
    comments text,
    scheduled_at timestamp without time zone,
    completed_at timestamp without time zone,
    attempt_number integer DEFAULT 1,
    is_current boolean DEFAULT false,
    result_data jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT chk_stage_record_recommendation CHECK (((recommendation IS NULL) OR ((recommendation)::text = ANY ((ARRAY['PASSED'::character varying, 'FAILED'::character varying, 'FOR_REVIEW'::character varying])::text[])))),
    CONSTRAINT chk_stage_record_status CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'SCHEDULED'::character varying, 'IN_PROGRESS'::character varying, 'COMPLETED'::character varying, 'SKIPPED'::character varying, 'FAILED'::character varying, 'CANCELLED'::character varying, 'RESCHEDULED'::character varying])::text[])))
);


ALTER TABLE public.applicant_stage_records OWNER TO postgres;

--
-- Name: applicant_stage_records_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.applicant_stage_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.applicant_stage_records_id_seq OWNER TO postgres;

--
-- Name: applicant_stage_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.applicant_stage_records_id_seq OWNED BY public.applicant_stage_records.id;


--
-- Name: applicant_work_experience; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.applicant_work_experience (
    id integer NOT NULL,
    applicant_id integer NOT NULL,
    company_name character varying(200) NOT NULL,
    "position" character varying(150) NOT NULL,
    start_date date,
    end_date date,
    reason_for_leaving text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.applicant_work_experience OWNER TO postgres;

--
-- Name: applicant_work_experience_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.applicant_work_experience_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.applicant_work_experience_id_seq OWNER TO postgres;

--
-- Name: applicant_work_experience_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.applicant_work_experience_id_seq OWNED BY public.applicant_work_experience.id;


--
-- Name: applicant_workflow_instances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.applicant_workflow_instances (
    id integer NOT NULL,
    applicant_id integer NOT NULL,
    workflow_id integer NOT NULL,
    current_stage_id integer,
    status character varying(50) DEFAULT 'ACTIVE'::character varying,
    workflow_snapshot jsonb,
    started_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.applicant_workflow_instances OWNER TO postgres;

--
-- Name: applicant_workflow_instances_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.applicant_workflow_instances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.applicant_workflow_instances_id_seq OWNER TO postgres;

--
-- Name: applicant_workflow_instances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.applicant_workflow_instances_id_seq OWNED BY public.applicant_workflow_instances.id;


--
-- Name: applicants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.applicants (
    id integer NOT NULL,
    job_position_id integer,
    first_name character varying(255) NOT NULL,
    middle_name character varying(255),
    last_name character varying(255) NOT NULL,
    suffix character varying(50),
    email character varying(255),
    phone character varying(50),
    address text,
    resume_url text,
    status character varying(50) DEFAULT 'NEW'::character varying,
    rating numeric(5,2),
    source character varying(100),
    notes text,
    applied_date date DEFAULT CURRENT_DATE,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    employee_id integer,
    workflow_instance_id integer,
    CONSTRAINT applicants_status_check CHECK (((status)::text = ANY (ARRAY['Initial'::text, 'Pending'::text, 'Final Interview'::text, 'Exam Interview'::text, 'Completed'::text, 'Fail'::text])))
);


ALTER TABLE public.applicants OWNER TO postgres;

--
-- Name: applicants_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.applicants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.applicants_id_seq OWNER TO postgres;

--
-- Name: applicants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.applicants_id_seq OWNED BY public.applicants.id;


--
-- Name: approval_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.approval_logs (
    id integer NOT NULL,
    request_type character varying(50),
    request_id integer NOT NULL,
    employee_id integer,
    approved_by integer,
    role character varying(50),
    action character varying(20),
    remarks text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.approval_logs OWNER TO postgres;

--
-- Name: approval_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.approval_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.approval_logs_id_seq OWNER TO postgres;

--
-- Name: approval_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.approval_logs_id_seq OWNED BY public.approval_logs.id;


--
-- Name: attendance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance (
    id integer NOT NULL,
    employee_id integer,
    check_in_time timestamp without time zone,
    check_out_time timestamp without time zone,
    date date NOT NULL,
    status character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    work_fraction numeric DEFAULT 1,
    half_day_type character varying(10),
    shift_id integer,
    shift_date date,
    source character varying(20) DEFAULT 'BIOMETRIC'::character varying NOT NULL,
    branch_id integer,
    timezone_used character varying(50),
    device_id integer,
    check_in_time_utc timestamp with time zone,
    check_out_time_utc timestamp with time zone,
    CONSTRAINT attendance_status_check CHECK (((status)::text = ANY ((ARRAY['PRESENT'::character varying, 'LATE'::character varying, 'ABSENT'::character varying, 'LEAVE'::character varying, 'HALF_DAY'::character varying])::text[]))),
    CONSTRAINT attendance_work_fraction_check CHECK ((work_fraction = ANY (ARRAY[(0)::numeric, 0.5, (1)::numeric]))),
    CONSTRAINT chk_attendance_source CHECK (((source)::text = ANY ((ARRAY['BIOMETRIC'::character varying, 'WEB'::character varying, 'MANUAL'::character varying, 'IMPORT'::character varying])::text[])))
);


ALTER TABLE public.attendance OWNER TO postgres;

--
-- Name: COLUMN attendance.source; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.attendance.source IS 'Origin of attendance record: BIOMETRIC, WEB, MANUAL, or IMPORT';


--
-- Name: COLUMN attendance.timezone_used; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.attendance.timezone_used IS 'IANA timezone used when generating check-in/check-out timestamps';


--
-- Name: COLUMN attendance.check_in_time_utc; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.attendance.check_in_time_utc IS 'UTC-normalized check-in time. Populated from check_in_time + timezone_used.';


--
-- Name: COLUMN attendance.check_out_time_utc; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.attendance.check_out_time_utc IS 'UTC-normalized check-out time. Populated from check_out_time + timezone_used.';


--
-- Name: attendance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attendance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attendance_id_seq OWNER TO postgres;

--
-- Name: attendance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attendance_id_seq OWNED BY public.attendance.id;


--
-- Name: attendance_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance_logs (
    id integer NOT NULL,
    raw_log_id integer,
    device_id integer,
    employee_code character varying(50),
    employee_id integer,
    log_timestamp timestamp without time zone NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    error_message text,
    processed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.attendance_logs OWNER TO postgres;

--
-- Name: attendance_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attendance_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attendance_logs_id_seq OWNER TO postgres;

--
-- Name: attendance_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attendance_logs_id_seq OWNED BY public.attendance_logs.id;


--
-- Name: attendance_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance_rules (
    id integer NOT NULL,
    late_threshold integer,
    grace_period integer,
    max_work_hours integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    late_deduction_type character varying(20) DEFAULT 'FIXED'::character varying,
    late_deduction_value numeric(10,2) DEFAULT 50,
    late_deduction_enabled boolean DEFAULT true,
    is_active boolean DEFAULT false
);


ALTER TABLE public.attendance_rules OWNER TO postgres;

--
-- Name: attendance_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attendance_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attendance_rules_id_seq OWNER TO postgres;

--
-- Name: attendance_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attendance_rules_id_seq OWNED BY public.attendance_rules.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id bigint NOT NULL,
    user_id integer,
    employee_id integer,
    branch_id integer,
    action character varying(50) NOT NULL,
    table_name character varying(50) NOT NULL,
    record_id integer,
    old_values jsonb,
    new_values jsonb,
    ip_address character varying(45),
    user_agent text,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: branch_rest_days; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.branch_rest_days (
    id integer NOT NULL,
    branch_id integer NOT NULL,
    day_of_week integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT branch_rest_days_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);


ALTER TABLE public.branch_rest_days OWNER TO postgres;

--
-- Name: COLUMN branch_rest_days.day_of_week; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.branch_rest_days.day_of_week IS '0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday';


--
-- Name: branch_rest_days_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.branch_rest_days_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.branch_rest_days_id_seq OWNER TO postgres;

--
-- Name: branch_rest_days_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.branch_rest_days_id_seq OWNED BY public.branch_rest_days.id;


--
-- Name: branches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.branches (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(255) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    address text,
    city character varying(100),
    province character varying(100),
    phone character varying(50),
    updated_at timestamp without time zone DEFAULT now(),
    timezone character varying(50) DEFAULT 'Asia/Manila'::character varying NOT NULL
);


ALTER TABLE public.branches OWNER TO postgres;

--
-- Name: COLUMN branches.timezone; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.branches.timezone IS 'IANA timezone identifier for the branch (e.g. Asia/Manila, Asia/Kuala_Lumpur)';


--
-- Name: branches_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.branches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.branches_id_seq OWNER TO postgres;

--
-- Name: branches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.branches_id_seq OWNED BY public.branches.id;


--
-- Name: calendar_days; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.calendar_days (
    id integer NOT NULL,
    date date,
    day_type character varying(20),
    is_paid boolean DEFAULT true,
    description text,
    branch_id integer
);


ALTER TABLE public.calendar_days OWNER TO postgres;

--
-- Name: calendar_days_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.calendar_days_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.calendar_days_id_seq OWNER TO postgres;

--
-- Name: calendar_days_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.calendar_days_id_seq OWNED BY public.calendar_days.id;


--
-- Name: company_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_settings (
    id integer NOT NULL,
    name character varying(150),
    address text,
    tin character varying(50),
    sss character varying(50),
    philhealth character varying(50),
    hdmf character varying(50),
    logo text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    enforce_sil boolean DEFAULT true,
    sil_min_days integer DEFAULT 5,
    conversion_rate numeric DEFAULT 1.0
);


ALTER TABLE public.company_settings OWNER TO postgres;

--
-- Name: company_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.company_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.company_settings_id_seq OWNER TO postgres;

--
-- Name: company_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.company_settings_id_seq OWNED BY public.company_settings.id;


--
-- Name: conversion_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversion_logs (
    id integer NOT NULL,
    year integer NOT NULL,
    processed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    total_processed integer DEFAULT 0,
    total_converted integer DEFAULT 0,
    total_amount numeric(15,2) DEFAULT 0,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    details jsonb,
    error_message text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.conversion_logs OWNER TO postgres;

--
-- Name: conversion_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.conversion_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conversion_logs_id_seq OWNER TO postgres;

--
-- Name: conversion_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.conversion_logs_id_seq OWNED BY public.conversion_logs.id;


--
-- Name: device_log_mappings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.device_log_mappings (
    id integer NOT NULL,
    device_id integer NOT NULL,
    field_source character varying(100) NOT NULL,
    field_target character varying(100) NOT NULL,
    transform_expression character varying(100),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.device_log_mappings OWNER TO postgres;

--
-- Name: device_log_mappings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.device_log_mappings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.device_log_mappings_id_seq OWNER TO postgres;

--
-- Name: device_log_mappings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.device_log_mappings_id_seq OWNED BY public.device_log_mappings.id;


--
-- Name: devices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.devices (
    id integer NOT NULL,
    name character varying(100),
    ip_address character varying(50),
    location character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    type character varying(50) DEFAULT 'BIOMETRIC'::character varying,
    status character varying(20) DEFAULT 'ACTIVE'::character varying,
    updated_at timestamp without time zone,
    serial_number character varying(100),
    model character varying(100),
    port integer,
    api_key character varying(255),
    last_connected_at timestamp without time zone,
    notes text,
    branch_id integer,
    api_key_hash text,
    api_key_created_at timestamp without time zone,
    api_key_last_used_at timestamp without time zone
);


ALTER TABLE public.devices OWNER TO postgres;

--
-- Name: devices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.devices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.devices_id_seq OWNER TO postgres;

--
-- Name: devices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.devices_id_seq OWNED BY public.devices.id;


--
-- Name: email_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_logs (
    id integer NOT NULL,
    employee_id integer,
    payroll_id integer,
    type character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    error text,
    sent_at timestamp without time zone,
    attempted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.email_logs OWNER TO postgres;

--
-- Name: email_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.email_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.email_logs_id_seq OWNER TO postgres;

--
-- Name: email_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.email_logs_id_seq OWNED BY public.email_logs.id;


--
-- Name: email_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_templates (
    id integer NOT NULL,
    type character varying(100) NOT NULL,
    subject character varying(255) NOT NULL,
    body_html text NOT NULL,
    body_text text,
    is_active boolean DEFAULT true,
    created_by integer,
    updated_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.email_templates OWNER TO postgres;

--
-- Name: email_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.email_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.email_templates_id_seq OWNER TO postgres;

--
-- Name: email_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.email_templates_id_seq OWNED BY public.email_templates.id;


--
-- Name: employee_approvers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_approvers (
    id integer NOT NULL,
    employee_id integer,
    approver_id integer,
    approval_type character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.employee_approvers OWNER TO postgres;

--
-- Name: employee_approvers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_approvers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_approvers_id_seq OWNER TO postgres;

--
-- Name: employee_approvers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_approvers_id_seq OWNED BY public.employee_approvers.id;


--
-- Name: employee_deductions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_deductions (
    id integer NOT NULL,
    employee_id integer,
    type character varying(50),
    amount numeric(10,2),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone
);


ALTER TABLE public.employee_deductions OWNER TO postgres;

--
-- Name: employee_deductions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_deductions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_deductions_id_seq OWNER TO postgres;

--
-- Name: employee_deductions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_deductions_id_seq OWNED BY public.employee_deductions.id;


--
-- Name: employee_device_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_device_users (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    device_id integer NOT NULL,
    device_user_id character varying(100) NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.employee_device_users OWNER TO postgres;

--
-- Name: employee_device_users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_device_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_device_users_id_seq OWNER TO postgres;

--
-- Name: employee_device_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_device_users_id_seq OWNED BY public.employee_device_users.id;


--
-- Name: employee_education; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_education (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    education_level character varying(30) NOT NULL,
    school_name character varying(200) NOT NULL,
    course_or_degree character varying(200),
    year_started integer,
    year_graduated integer,
    honors_awards text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT employee_education_education_level_check CHECK (((education_level)::text = ANY ((ARRAY['elementary'::character varying, 'high_school'::character varying, 'college'::character varying, 'masters'::character varying, 'doctorate'::character varying, 'vocational'::character varying, 'other'::character varying])::text[])))
);


ALTER TABLE public.employee_education OWNER TO postgres;

--
-- Name: employee_education_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_education_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_education_id_seq OWNER TO postgres;

--
-- Name: employee_education_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_education_id_seq OWNED BY public.employee_education.id;


--
-- Name: employee_family_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_family_members (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    relationship_type character varying(30) NOT NULL,
    full_name character varying(150) NOT NULL,
    birthdate date,
    occupation character varying(150),
    contact_number character varying(30),
    address text,
    is_dependent boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT employee_family_members_relationship_type_check CHECK (((relationship_type)::text = ANY ((ARRAY['spouse'::character varying, 'child'::character varying, 'father'::character varying, 'mother'::character varying, 'parent'::character varying, 'dependent'::character varying])::text[])))
);


ALTER TABLE public.employee_family_members OWNER TO postgres;

--
-- Name: employee_family_members_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_family_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_family_members_id_seq OWNER TO postgres;

--
-- Name: employee_family_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_family_members_id_seq OWNED BY public.employee_family_members.id;


--
-- Name: employee_kpi_evaluations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_kpi_evaluations (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    evaluator_id integer NOT NULL,
    template_id integer NOT NULL,
    evaluation_period_start date,
    evaluation_period_end date,
    status character varying(30) DEFAULT 'Draft'::character varying,
    self_evaluation text,
    manager_comments text,
    final_score numeric(5,2) DEFAULT 0,
    recommendation character varying(50),
    hr_approved boolean DEFAULT false,
    hr_approval_date date,
    hr_comments text,
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.employee_kpi_evaluations OWNER TO postgres;

--
-- Name: employee_kpi_evaluations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_kpi_evaluations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_kpi_evaluations_id_seq OWNER TO postgres;

--
-- Name: employee_kpi_evaluations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_kpi_evaluations_id_seq OWNED BY public.employee_kpi_evaluations.id;


--
-- Name: employee_kpi_scores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_kpi_scores (
    id integer NOT NULL,
    evaluation_id integer NOT NULL,
    template_item_id integer NOT NULL,
    manager_score numeric(5,2) DEFAULT 0,
    weighted_score numeric(5,2) DEFAULT 0,
    remarks text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.employee_kpi_scores OWNER TO postgres;

--
-- Name: employee_kpi_scores_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_kpi_scores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_kpi_scores_id_seq OWNER TO postgres;

--
-- Name: employee_kpi_scores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_kpi_scores_id_seq OWNED BY public.employee_kpi_scores.id;


--
-- Name: employee_leave_balances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_leave_balances (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    leave_type_id integer NOT NULL,
    year integer DEFAULT (EXTRACT(year FROM CURRENT_DATE))::integer NOT NULL,
    total_days numeric(5,1) DEFAULT 0,
    used_days numeric(5,1) DEFAULT 0,
    carried_over_days numeric(5,1) DEFAULT 0,
    adjusted_days numeric(5,1) DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.employee_leave_balances OWNER TO postgres;

--
-- Name: employee_leave_balances_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_leave_balances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_leave_balances_id_seq OWNER TO postgres;

--
-- Name: employee_leave_balances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_leave_balances_id_seq OWNED BY public.employee_leave_balances.id;


--
-- Name: employee_onboarding; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_onboarding (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    applicant_id integer,
    onboarding_date date,
    status character varying(50) DEFAULT 'PENDING'::character varying,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT employee_onboarding_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'IN_PROGRESS'::character varying, 'COMPLETED'::character varying, 'CANCELLED'::character varying])::text[])))
);


ALTER TABLE public.employee_onboarding OWNER TO postgres;

--
-- Name: employee_onboarding_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_onboarding_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_onboarding_id_seq OWNER TO postgres;

--
-- Name: employee_onboarding_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_onboarding_id_seq OWNED BY public.employee_onboarding.id;


--
-- Name: employee_requirements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_requirements (
    id integer NOT NULL,
    onboarding_id integer NOT NULL,
    requirement_name character varying(255) NOT NULL,
    description text,
    status character varying(50) DEFAULT 'PENDING'::character varying,
    submitted_at timestamp without time zone,
    verified_at timestamp without time zone,
    file_url text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT employee_requirements_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'SUBMITTED'::character varying, 'VERIFIED'::character varying, 'REJECTED'::character varying])::text[])))
);


ALTER TABLE public.employee_requirements OWNER TO postgres;

--
-- Name: employee_requirements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_requirements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_requirements_id_seq OWNER TO postgres;

--
-- Name: employee_requirements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_requirements_id_seq OWNED BY public.employee_requirements.id;


--
-- Name: employee_rest_days; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_rest_days (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    day_of_week integer NOT NULL,
    effective_date date DEFAULT CURRENT_DATE NOT NULL,
    end_date date,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT employee_rest_days_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);


ALTER TABLE public.employee_rest_days OWNER TO postgres;

--
-- Name: COLUMN employee_rest_days.day_of_week; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.employee_rest_days.day_of_week IS '0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday';


--
-- Name: employee_rest_days_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_rest_days_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_rest_days_id_seq OWNER TO postgres;

--
-- Name: employee_rest_days_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_rest_days_id_seq OWNED BY public.employee_rest_days.id;


--
-- Name: employee_rotation_group_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_rotation_group_assignments (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    rotation_group_id integer NOT NULL,
    effective_date date NOT NULL,
    end_date date,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.employee_rotation_group_assignments OWNER TO postgres;

--
-- Name: employee_rotation_group_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_rotation_group_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_rotation_group_assignments_id_seq OWNER TO postgres;

--
-- Name: employee_rotation_group_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_rotation_group_assignments_id_seq OWNED BY public.employee_rotation_group_assignments.id;


--
-- Name: employee_salary; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_salary (
    id integer NOT NULL,
    employee_id integer,
    basic_salary numeric(10,2),
    daily_rate numeric(10,2),
    overtime_rate numeric(10,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    working_days_per_month integer DEFAULT 26
);


ALTER TABLE public.employee_salary OWNER TO postgres;

--
-- Name: employee_salary_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_salary_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_salary_id_seq OWNER TO postgres;

--
-- Name: employee_salary_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_salary_id_seq OWNED BY public.employee_salary.id;


--
-- Name: employee_shift_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_shift_assignments (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    shift_id integer NOT NULL,
    effective_date date NOT NULL,
    end_date date,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.employee_shift_assignments OWNER TO postgres;

--
-- Name: employee_shift_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_shift_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_shift_assignments_id_seq OWNER TO postgres;

--
-- Name: employee_shift_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_shift_assignments_id_seq OWNED BY public.employee_shift_assignments.id;


--
-- Name: employee_work_experience; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_work_experience (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    company_name character varying(200) NOT NULL,
    "position" character varying(150) NOT NULL,
    start_date date,
    end_date date,
    reason_for_leaving text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.employee_work_experience OWNER TO postgres;

--
-- Name: employee_work_experience_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_work_experience_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_work_experience_id_seq OWNER TO postgres;

--
-- Name: employee_work_experience_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_work_experience_id_seq OWNED BY public.employee_work_experience.id;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    employee_code character varying(50) NOT NULL,
    rfid_tag character varying(100),
    fingerprint_id character varying(100),
    department character varying(100),
    status character varying(20) DEFAULT 'ACTIVE'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    birthday date,
    gender character varying(10),
    contact_number character varying(20),
    address text,
    "position" character varying(100),
    profile_image text,
    hired_date date DEFAULT CURRENT_DATE,
    marital_status character varying(20),
    sss_number character varying(50),
    philhealth_number character varying(50),
    hdmf_number character varying(50),
    tin_number character varying(50),
    first_name character varying(50),
    middle_name character varying(50),
    last_name character varying(50),
    suffix character varying(20),
    emergency_contact_name character varying(100),
    emergency_contact_number character varying(20),
    emergency_contact_address text,
    emergency_contact_relation character varying(50),
    email character varying(255),
    resignation_date date,
    termination_date date,
    final_pay_processed boolean DEFAULT false,
    final_pay_date timestamp without time zone,
    final_pay_amount numeric(10,2),
    last_working_date date,
    branch_id integer,
    employment_status character varying(50) DEFAULT 'Probationary'::character varying,
    termination_reason text,
    probation_period_months integer,
    regularization_date date,
    CONSTRAINT employees_probation_period_months_check CHECK (((probation_period_months IS NULL) OR ((probation_period_months >= 1) AND (probation_period_months <= 24)))),
    CONSTRAINT employees_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'RESIGNED'::character varying, 'TERMINATED'::character varying, 'ARCHIVED'::character varying])::text[])))
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employees_id_seq OWNER TO postgres;

--
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- Name: final_pay; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.final_pay (
    id integer NOT NULL,
    employee_id integer,
    resignation_date date,
    termination_date date,
    last_working_date date,
    days_worked integer,
    salary_until_last_day numeric(10,2),
    leave_conversion_amount numeric(10,2) DEFAULT 0,
    total_amount numeric(10,2),
    processed_by integer,
    processed_at timestamp without time zone DEFAULT now(),
    status character varying(20) DEFAULT 'PROCESSED'::character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.final_pay OWNER TO postgres;

--
-- Name: final_pay_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.final_pay_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.final_pay_id_seq OWNER TO postgres;

--
-- Name: final_pay_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.final_pay_id_seq OWNED BY public.final_pay.id;


--
-- Name: forecast_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.forecast_logs (
    id bigint NOT NULL,
    metric_name character varying(100) NOT NULL,
    branch_id integer,
    department character varying(100),
    predicted_value numeric(15,2) NOT NULL,
    actual_value numeric(15,2),
    confidence numeric(5,4),
    forecast_date date NOT NULL,
    period_type character varying(20) DEFAULT 'WEEKLY'::character varying NOT NULL,
    method character varying(50) DEFAULT 'MOVING_AVERAGE'::character varying NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    generated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.forecast_logs OWNER TO postgres;

--
-- Name: forecast_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.forecast_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.forecast_logs_id_seq OWNER TO postgres;

--
-- Name: forecast_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.forecast_logs_id_seq OWNED BY public.forecast_logs.id;


--
-- Name: hr_form_answers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hr_form_answers (
    id integer NOT NULL,
    assignment_id integer NOT NULL,
    field_id integer NOT NULL,
    answer text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.hr_form_answers OWNER TO postgres;

--
-- Name: hr_form_answers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hr_form_answers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hr_form_answers_id_seq OWNER TO postgres;

--
-- Name: hr_form_answers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hr_form_answers_id_seq OWNED BY public.hr_form_answers.id;


--
-- Name: hr_form_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hr_form_assignments (
    id integer NOT NULL,
    form_id integer NOT NULL,
    employee_id integer NOT NULL,
    assigned_by integer,
    due_date date,
    status character varying(30) DEFAULT 'Pending'::character varying,
    submitted_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.hr_form_assignments OWNER TO postgres;

--
-- Name: hr_form_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hr_form_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hr_form_assignments_id_seq OWNER TO postgres;

--
-- Name: hr_form_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hr_form_assignments_id_seq OWNED BY public.hr_form_assignments.id;


--
-- Name: hr_form_fields; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hr_form_fields (
    id integer NOT NULL,
    form_id integer NOT NULL,
    label character varying(255) NOT NULL,
    field_type character varying(50) NOT NULL,
    field_order integer DEFAULT 0,
    required boolean DEFAULT false,
    options text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.hr_form_fields OWNER TO postgres;

--
-- Name: hr_form_fields_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hr_form_fields_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hr_form_fields_id_seq OWNER TO postgres;

--
-- Name: hr_form_fields_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hr_form_fields_id_seq OWNED BY public.hr_form_fields.id;


--
-- Name: hr_form_submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hr_form_submissions (
    id integer NOT NULL,
    assignment_id integer NOT NULL,
    employee_id integer NOT NULL,
    form_id integer NOT NULL,
    answer_sheet_data jsonb,
    answer_sheet_config jsonb,
    status character varying(30) DEFAULT 'Submitted'::character varying,
    submitted_at timestamp without time zone DEFAULT now(),
    reviewed_at timestamp without time zone,
    reviewed_by integer,
    remarks text
);


ALTER TABLE public.hr_form_submissions OWNER TO postgres;

--
-- Name: hr_form_submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hr_form_submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hr_form_submissions_id_seq OWNER TO postgres;

--
-- Name: hr_form_submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hr_form_submissions_id_seq OWNED BY public.hr_form_submissions.id;


--
-- Name: hr_forms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hr_forms (
    id integer NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    sheet_data jsonb,
    sheet_config jsonb,
    is_active boolean DEFAULT true,
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.hr_forms OWNER TO postgres;

--
-- Name: hr_forms_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hr_forms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hr_forms_id_seq OWNER TO postgres;

--
-- Name: hr_forms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hr_forms_id_seq OWNED BY public.hr_forms.id;


--
-- Name: hr_policy_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hr_policy_documents (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    category character varying(100),
    content text NOT NULL,
    is_active boolean DEFAULT true,
    created_by integer,
    updated_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    content_format character varying(20) DEFAULT 'html'::character varying
);


ALTER TABLE public.hr_policy_documents OWNER TO postgres;

--
-- Name: hr_policy_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hr_policy_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hr_policy_documents_id_seq OWNER TO postgres;

--
-- Name: hr_policy_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hr_policy_documents_id_seq OWNED BY public.hr_policy_documents.id;


--
-- Name: job_positions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_positions (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    department character varying(255),
    description text,
    requirements text,
    salary_range character varying(100),
    status character varying(50) DEFAULT 'ACTIVE'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    employment_type character varying(50),
    branch_id integer,
    workflow_id integer,
    CONSTRAINT job_positions_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'CLOSED'::character varying, 'ON_HOLD'::character varying])::text[])))
);


ALTER TABLE public.job_positions OWNER TO postgres;

--
-- Name: job_positions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.job_positions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.job_positions_id_seq OWNER TO postgres;

--
-- Name: job_positions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.job_positions_id_seq OWNED BY public.job_positions.id;


--
-- Name: kpi_template_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kpi_template_items (
    id integer NOT NULL,
    template_id integer NOT NULL,
    kpi_name character varying(150) NOT NULL,
    description text,
    weight numeric(5,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.kpi_template_items OWNER TO postgres;

--
-- Name: kpi_template_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.kpi_template_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.kpi_template_items_id_seq OWNER TO postgres;

--
-- Name: kpi_template_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.kpi_template_items_id_seq OWNED BY public.kpi_template_items.id;


--
-- Name: kpi_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kpi_templates (
    id integer NOT NULL,
    name character varying(150) NOT NULL,
    description text,
    department character varying(100),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.kpi_templates OWNER TO postgres;

--
-- Name: kpi_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.kpi_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.kpi_templates_id_seq OWNER TO postgres;

--
-- Name: kpi_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.kpi_templates_id_seq OWNED BY public.kpi_templates.id;


--
-- Name: leave_conversions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_conversions (
    id integer NOT NULL,
    employee_id integer,
    year integer NOT NULL,
    leave_type character varying(20),
    days_converted numeric(5,2) NOT NULL,
    daily_rate numeric(10,2),
    conversion_rate numeric(5,2),
    amount numeric(10,2) NOT NULL,
    processed_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    remarks text,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.leave_conversions OWNER TO postgres;

--
-- Name: leave_conversions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leave_conversions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leave_conversions_id_seq OWNER TO postgres;

--
-- Name: leave_conversions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leave_conversions_id_seq OWNED BY public.leave_conversions.id;


--
-- Name: leave_credits_backup_before_drop; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_credits_backup_before_drop (
    id integer,
    employee_id integer,
    sick_leave numeric(5,1),
    vacation_leave numeric(5,1),
    used_sick_leave numeric(5,1),
    used_vacation_leave numeric(5,1),
    created_at timestamp without time zone,
    maternity_leave numeric(5,1),
    used_maternity_leave numeric(5,1),
    emergency_leave numeric(5,1),
    used_emergency_leave numeric(5,1),
    no_pay_leave numeric(5,1),
    used_no_pay_leave numeric(5,1),
    last_conversion_year integer
);


ALTER TABLE public.leave_credits_backup_before_drop OWNER TO postgres;

--
-- Name: TABLE leave_credits_backup_before_drop; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.leave_credits_backup_before_drop IS 'Backup of legacy leave_credits table before migration to employee_leave_balances. Created by migration 047.';


--
-- Name: COLUMN leave_credits_backup_before_drop.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.leave_credits_backup_before_drop.id IS 'Original primary key from leave_credits';


--
-- Name: COLUMN leave_credits_backup_before_drop.employee_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.leave_credits_backup_before_drop.employee_id IS 'References employees(id)';


--
-- Name: COLUMN leave_credits_backup_before_drop.sick_leave; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.leave_credits_backup_before_drop.sick_leave IS 'Legacy column — replaced by employee_leave_balances with leave_type code = SL';


--
-- Name: COLUMN leave_credits_backup_before_drop.vacation_leave; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.leave_credits_backup_before_drop.vacation_leave IS 'Legacy column — replaced by employee_leave_balances with leave_type code = VL';


--
-- Name: COLUMN leave_credits_backup_before_drop.used_sick_leave; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.leave_credits_backup_before_drop.used_sick_leave IS 'Legacy column — replaced by employee_leave_balances used_days for SL';


--
-- Name: COLUMN leave_credits_backup_before_drop.used_vacation_leave; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.leave_credits_backup_before_drop.used_vacation_leave IS 'Legacy column — replaced by employee_leave_balances used_days for VL';


--
-- Name: COLUMN leave_credits_backup_before_drop.created_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.leave_credits_backup_before_drop.created_at IS 'Original timestamp';


--
-- Name: COLUMN leave_credits_backup_before_drop.maternity_leave; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.leave_credits_backup_before_drop.maternity_leave IS 'Legacy column — replaced by employee_leave_balances with leave_type code = ML';


--
-- Name: COLUMN leave_credits_backup_before_drop.used_maternity_leave; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.leave_credits_backup_before_drop.used_maternity_leave IS 'Legacy column — replaced by employee_leave_balances used_days for ML';


--
-- Name: COLUMN leave_credits_backup_before_drop.emergency_leave; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.leave_credits_backup_before_drop.emergency_leave IS 'Legacy column — replaced by employee_leave_balances with leave_type code = EL';


--
-- Name: COLUMN leave_credits_backup_before_drop.used_emergency_leave; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.leave_credits_backup_before_drop.used_emergency_leave IS 'Legacy column — replaced by employee_leave_balances used_days for EL';


--
-- Name: COLUMN leave_credits_backup_before_drop.no_pay_leave; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.leave_credits_backup_before_drop.no_pay_leave IS 'Legacy column — replaced by employee_leave_balances with leave_type code = NP';


--
-- Name: COLUMN leave_credits_backup_before_drop.used_no_pay_leave; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.leave_credits_backup_before_drop.used_no_pay_leave IS 'Legacy column — replaced by employee_leave_balances used_days for NP';


--
-- Name: COLUMN leave_credits_backup_before_drop.last_conversion_year; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.leave_credits_backup_before_drop.last_conversion_year IS 'Legacy column — no longer used; conversion year tracked in leave_conversions';


--
-- Name: leave_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_types (
    id integer NOT NULL,
    code character varying(20),
    name character varying(50),
    is_paid boolean DEFAULT true,
    is_convertible boolean DEFAULT false,
    max_convertible_days integer,
    requires_balance boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    default_days integer,
    is_enabled boolean DEFAULT true,
    requires_attachment boolean DEFAULT false,
    requires_approval boolean DEFAULT true,
    employee_requestable boolean DEFAULT true,
    hr_only boolean DEFAULT false,
    include_in_credits boolean DEFAULT true,
    is_unlimited boolean DEFAULT false,
    affects_payroll boolean DEFAULT true,
    deducts_salary boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    description text
);


ALTER TABLE public.leave_types OWNER TO postgres;

--
-- Name: leave_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leave_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leave_types_id_seq OWNER TO postgres;

--
-- Name: leave_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leave_types_id_seq OWNED BY public.leave_types.id;


--
-- Name: leaves; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leaves (
    id integer NOT NULL,
    employee_id integer,
    type character varying(50),
    from_date date,
    to_date date,
    reason text,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    day_fraction numeric DEFAULT 1,
    half_day_type character varying(10),
    rejection_reason text,
    CONSTRAINT leaves_day_fraction_check CHECK ((day_fraction = ANY (ARRAY[0.5, (1)::numeric]))),
    CONSTRAINT leaves_half_day_type_check CHECK (((half_day_type)::text = ANY ((ARRAY['MORNING'::character varying, 'AFTERNOON'::character varying, NULL::character varying])::text[]))),
    CONSTRAINT leaves_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying])::text[])))
);


ALTER TABLE public.leaves OWNER TO postgres;

--
-- Name: leaves_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leaves_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leaves_id_seq OWNER TO postgres;

--
-- Name: leaves_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leaves_id_seq OWNED BY public.leaves.id;


--
-- Name: man_hour_report_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.man_hour_report_details (
    id integer NOT NULL,
    report_id integer NOT NULL,
    time_from time without time zone NOT NULL,
    time_to time without time zone NOT NULL,
    activity text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.man_hour_report_details OWNER TO postgres;

--
-- Name: man_hour_report_details_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.man_hour_report_details_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.man_hour_report_details_id_seq OWNER TO postgres;

--
-- Name: man_hour_report_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.man_hour_report_details_id_seq OWNED BY public.man_hour_report_details.id;


--
-- Name: man_hour_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.man_hour_reports (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    work_date date NOT NULL,
    task text NOT NULL,
    hours numeric(5,2) NOT NULL,
    remarks text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.man_hour_reports OWNER TO postgres;

--
-- Name: man_hour_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.man_hour_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.man_hour_reports_id_seq OWNER TO postgres;

--
-- Name: man_hour_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.man_hour_reports_id_seq OWNED BY public.man_hour_reports.id;


--
-- Name: notification_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_rules (
    id integer NOT NULL,
    rule_key character varying(100) NOT NULL,
    module character varying(50) NOT NULL,
    name character varying(150) NOT NULL,
    description text,
    is_enabled boolean DEFAULT true NOT NULL,
    in_app_enabled boolean DEFAULT true NOT NULL,
    email_enabled boolean DEFAULT false NOT NULL,
    threshold_count integer,
    threshold_days integer,
    threshold_hours numeric(10,2),
    threshold_percent numeric(10,4),
    frequency character varying(30) DEFAULT 'immediate'::character varying NOT NULL,
    target_roles text[],
    template_key character varying(100),
    is_system boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notification_rules OWNER TO postgres;

--
-- Name: notification_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notification_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notification_rules_id_seq OWNER TO postgres;

--
-- Name: notification_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notification_rules_id_seq OWNED BY public.notification_rules.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(150) NOT NULL,
    message text NOT NULL,
    reference_id integer,
    meta jsonb,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: overtime_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.overtime_requests (
    id integer NOT NULL,
    employee_id integer,
    date date NOT NULL,
    start_time time without time zone,
    end_time time without time zone,
    hours numeric(5,2),
    reason text,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    approved_by integer,
    approved_at timestamp without time zone,
    rejected_by integer,
    rejected_at timestamp without time zone,
    rejected_reason text,
    updated_at timestamp without time zone,
    is_paid boolean DEFAULT false,
    paid_at timestamp without time zone,
    paid_in_payroll_id integer,
    CONSTRAINT overtime_requests_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying])::text[])))
);


ALTER TABLE public.overtime_requests OWNER TO postgres;

--
-- Name: overtime_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.overtime_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.overtime_requests_id_seq OWNER TO postgres;

--
-- Name: overtime_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.overtime_requests_id_seq OWNED BY public.overtime_requests.id;


--
-- Name: pay_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pay_rules (
    id integer NOT NULL,
    day_type character varying(50),
    multiplier numeric(5,2)
);


ALTER TABLE public.pay_rules OWNER TO postgres;

--
-- Name: pay_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pay_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pay_rules_id_seq OWNER TO postgres;

--
-- Name: pay_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pay_rules_id_seq OWNED BY public.pay_rules.id;


--
-- Name: payroll; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payroll (
    id integer NOT NULL,
    employee_id integer,
    month integer,
    year integer,
    basic_salary numeric(10,2),
    overtime_pay numeric(10,2),
    deductions numeric(10,2),
    net_salary numeric(10,2),
    status character varying(20) DEFAULT 'UNPAID'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    late_deduction numeric(10,2) DEFAULT 0,
    absent_deduction numeric(10,2) DEFAULT 0,
    government_deduction numeric(10,2) DEFAULT 0,
    cutoff_start date,
    cutoff_end date,
    pay_date date,
    rule_snapshot jsonb,
    leave_conversion numeric DEFAULT 0,
    branch_id integer,
    night_differential_hours numeric(6,2) DEFAULT 0,
    night_differential_pay numeric(10,2) DEFAULT 0,
    paid_at timestamp without time zone,
    paid_by integer,
    locked_at timestamp without time zone,
    locked_by integer,
    voided_at timestamp without time zone,
    voided_by integer,
    CONSTRAINT payroll_status_check CHECK (((status)::text = ANY ((ARRAY['PAID'::character varying, 'UNPAID'::character varying, 'LOCKED'::character varying, 'VOID'::character varying])::text[])))
);


ALTER TABLE public.payroll OWNER TO postgres;

--
-- Name: payroll_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payroll_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payroll_id_seq OWNER TO postgres;

--
-- Name: payroll_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payroll_id_seq OWNED BY public.payroll.id;


--
-- Name: payroll_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payroll_rules (
    id integer NOT NULL,
    rule_key character varying(50) NOT NULL,
    rule_value numeric(6,4) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.payroll_rules OWNER TO postgres;

--
-- Name: payroll_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payroll_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payroll_rules_id_seq OWNER TO postgres;

--
-- Name: payroll_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payroll_rules_id_seq OWNED BY public.payroll_rules.id;


--
-- Name: payroll_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payroll_settings (
    id integer NOT NULL,
    type character varying(20),
    first_cutoff_day integer,
    second_cutoff_day integer,
    pay_day integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.payroll_settings OWNER TO postgres;

--
-- Name: payroll_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payroll_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payroll_settings_id_seq OWNER TO postgres;

--
-- Name: payroll_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payroll_settings_id_seq OWNED BY public.payroll_settings.id;


--
-- Name: raw_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.raw_logs (
    id integer NOT NULL,
    device_id integer,
    employee_code character varying(50),
    "timestamp" timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    raw_payload text,
    source character varying(20) DEFAULT 'API'::character varying NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    error_message text,
    processed_at timestamp without time zone,
    retry_count integer DEFAULT 0 NOT NULL,
    last_retry_at timestamp without time zone,
    processing_started_at timestamp without time zone
);


ALTER TABLE public.raw_logs OWNER TO postgres;

--
-- Name: raw_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.raw_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.raw_logs_id_seq OWNER TO postgres;

--
-- Name: raw_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.raw_logs_id_seq OWNED BY public.raw_logs.id;


--
-- Name: recruitment_workflow_stages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recruitment_workflow_stages (
    id integer NOT NULL,
    workflow_id integer NOT NULL,
    stage_name character varying(150) NOT NULL,
    stage_type character varying(50) NOT NULL,
    stage_category character varying(50),
    sequence_order integer NOT NULL,
    is_required boolean DEFAULT true,
    requires_assignment boolean DEFAULT false,
    requires_score boolean DEFAULT false,
    requires_approval boolean DEFAULT false,
    passing_score numeric(5,2),
    next_stage_on_pass integer,
    next_stage_on_fail integer,
    allow_skip boolean DEFAULT false,
    auto_proceed_on_pass boolean DEFAULT false,
    days_to_complete integer,
    is_terminal boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT chk_stage_type CHECK (((stage_type)::text = ANY ((ARRAY['INTERVIEW'::character varying, 'EXAM'::character varying, 'APPROVAL'::character varying, 'DOCUMENT_CHECK'::character varying, 'MEDICAL'::character varying, 'BACKGROUND_CHECK'::character varying, 'OFFER'::character varying, 'ONBOARDING'::character varying, 'CONVERT_TO_EMPLOYEE'::character varying, 'CUSTOM'::character varying])::text[])))
);


ALTER TABLE public.recruitment_workflow_stages OWNER TO postgres;

--
-- Name: recruitment_workflow_stages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recruitment_workflow_stages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recruitment_workflow_stages_id_seq OWNER TO postgres;

--
-- Name: recruitment_workflow_stages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recruitment_workflow_stages_id_seq OWNED BY public.recruitment_workflow_stages.id;


--
-- Name: recruitment_workflows; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recruitment_workflows (
    id integer NOT NULL,
    name character varying(150) NOT NULL,
    description text,
    branch_id integer,
    job_position_id integer,
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true,
    version integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.recruitment_workflows OWNER TO postgres;

--
-- Name: recruitment_workflows_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recruitment_workflows_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recruitment_workflows_id_seq OWNER TO postgres;

--
-- Name: recruitment_workflows_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recruitment_workflows_id_seq OWNED BY public.recruitment_workflows.id;


--
-- Name: rotation_group_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rotation_group_assignments (
    id integer NOT NULL,
    group_id integer NOT NULL,
    pattern_id integer NOT NULL,
    effective_date date NOT NULL,
    end_date date,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.rotation_group_assignments OWNER TO postgres;

--
-- Name: rotation_group_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rotation_group_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rotation_group_assignments_id_seq OWNER TO postgres;

--
-- Name: rotation_group_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rotation_group_assignments_id_seq OWNED BY public.rotation_group_assignments.id;


--
-- Name: rotation_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rotation_groups (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(20),
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.rotation_groups OWNER TO postgres;

--
-- Name: rotation_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rotation_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rotation_groups_id_seq OWNER TO postgres;

--
-- Name: rotation_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rotation_groups_id_seq OWNED BY public.rotation_groups.id;


--
-- Name: rotation_pattern_steps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rotation_pattern_steps (
    id integer NOT NULL,
    pattern_id integer NOT NULL,
    day_offset integer NOT NULL,
    shift_id integer,
    is_rest_day boolean DEFAULT false,
    CONSTRAINT rotation_pattern_steps_day_offset_check CHECK ((day_offset >= 0))
);


ALTER TABLE public.rotation_pattern_steps OWNER TO postgres;

--
-- Name: rotation_pattern_steps_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rotation_pattern_steps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rotation_pattern_steps_id_seq OWNER TO postgres;

--
-- Name: rotation_pattern_steps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rotation_pattern_steps_id_seq OWNED BY public.rotation_pattern_steps.id;


--
-- Name: rotation_patterns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rotation_patterns (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    cycle_days integer NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT rotation_patterns_cycle_days_check CHECK ((cycle_days > 0))
);


ALTER TABLE public.rotation_patterns OWNER TO postgres;

--
-- Name: rotation_patterns_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rotation_patterns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rotation_patterns_id_seq OWNER TO postgres;

--
-- Name: rotation_patterns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rotation_patterns_id_seq OWNED BY public.rotation_patterns.id;


--
-- Name: shift_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shift_schedules (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    type character varying(20) NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    code character varying(20),
    break_start time without time zone,
    break_end time without time zone,
    grace_minutes integer DEFAULT 0,
    required_hours numeric(4,2) DEFAULT 8,
    flex_start_window time without time zone,
    flex_end_window time without time zone,
    is_night_shift boolean DEFAULT false,
    is_flexitime boolean DEFAULT false,
    CONSTRAINT shift_schedules_type_check CHECK (((type)::text = ANY ((ARRAY['MORNING'::character varying, 'MID'::character varying, 'NIGHT'::character varying, 'FLEXITIME'::character varying])::text[])))
);


ALTER TABLE public.shift_schedules OWNER TO postgres;

--
-- Name: shift_schedules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.shift_schedules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shift_schedules_id_seq OWNER TO postgres;

--
-- Name: shift_schedules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shift_schedules_id_seq OWNED BY public.shift_schedules.id;


--
-- Name: smtp_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.smtp_settings (
    id integer NOT NULL,
    host character varying(255) NOT NULL,
    port integer DEFAULT 587 NOT NULL,
    encryption public.smtp_encryption DEFAULT 'tls'::public.smtp_encryption,
    username character varying(255) NOT NULL,
    password text NOT NULL,
    from_email character varying(255) NOT NULL,
    from_name character varying(255),
    is_active boolean DEFAULT true,
    test_email_sent boolean DEFAULT false,
    last_test_sent_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.smtp_settings OWNER TO postgres;

--
-- Name: smtp_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.smtp_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.smtp_settings_id_seq OWNER TO postgres;

--
-- Name: smtp_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.smtp_settings_id_seq OWNED BY public.smtp_settings.id;


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_settings (
    id integer NOT NULL,
    key character varying(100) NOT NULL,
    value text NOT NULL,
    description text,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.system_settings OWNER TO postgres;

--
-- Name: system_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.system_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_settings_id_seq OWNER TO postgres;

--
-- Name: system_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.system_settings_id_seq OWNED BY public.system_settings.id;


--
-- Name: system_settings_notification_backup_before_deprecation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_settings_notification_backup_before_deprecation (
    id integer,
    key character varying(100),
    value text,
    description text,
    updated_at timestamp without time zone
);


ALTER TABLE public.system_settings_notification_backup_before_deprecation OWNER TO postgres;

--
-- Name: time_modification_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.time_modification_requests (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    attendance_id integer NOT NULL,
    requested_check_in time without time zone,
    requested_check_out time without time zone,
    reason text NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    reviewed_by integer,
    reviewed_at timestamp without time zone,
    rejection_reason text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.time_modification_requests OWNER TO postgres;

--
-- Name: time_modification_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.time_modification_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.time_modification_requests_id_seq OWNER TO postgres;

--
-- Name: time_modification_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.time_modification_requests_id_seq OWNED BY public.time_modification_requests.id;


--
-- Name: user_branch_access; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_branch_access (
    id integer NOT NULL,
    user_id integer NOT NULL,
    branch_id integer NOT NULL
);


ALTER TABLE public.user_branch_access OWNER TO postgres;

--
-- Name: user_branch_access_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_branch_access_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_branch_access_id_seq OWNER TO postgres;

--
-- Name: user_branch_access_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_branch_access_id_seq OWNED BY public.user_branch_access.id;


--
-- Name: user_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_permissions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    permission_key character varying(100) NOT NULL,
    is_allowed boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_permissions OWNER TO postgres;

--
-- Name: user_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_permissions_id_seq OWNER TO postgres;

--
-- Name: user_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_permissions_id_seq OWNED BY public.user_permissions.id;


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sessions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    refresh_token_hash character varying(255) NOT NULL,
    device_name character varying(255) DEFAULT ''::character varying,
    browser character varying(100) DEFAULT ''::character varying,
    ip_address character varying(45) DEFAULT ''::character varying,
    user_agent text DEFAULT ''::text,
    is_active boolean DEFAULT true,
    last_activity_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_sessions OWNER TO postgres;

--
-- Name: TABLE user_sessions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.user_sessions IS 'Tracks active refresh token sessions per user';


--
-- Name: COLUMN user_sessions.refresh_token_hash; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_sessions.refresh_token_hash IS 'SHA-256 hash of the refresh token (never store raw token)';


--
-- Name: COLUMN user_sessions.is_active; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_sessions.is_active IS 'Soft-delete flag â€” set to false on logout or token rotation';


--
-- Name: COLUMN user_sessions.last_activity_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_sessions.last_activity_at IS 'Updated on each token refresh';


--
-- Name: COLUMN user_sessions.expires_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_sessions.expires_at IS 'Mirrors the refresh token expiry (default 7 days from creation)';


--
-- Name: user_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_sessions_id_seq OWNER TO postgres;

--
-- Name: user_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_sessions_id_seq OWNED BY public.user_sessions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password_hash text NOT NULL,
    role character varying(20) NOT NULL,
    employee_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    failed_login_attempts integer DEFAULT 0,
    locked_until timestamp without time zone,
    last_failed_login_at timestamp without time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: _migration_020_repair_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._migration_020_repair_log ALTER COLUMN id SET DEFAULT nextval('public._migration_020_repair_log_id_seq'::regclass);


--
-- Name: anomaly_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anomaly_logs ALTER COLUMN id SET DEFAULT nextval('public.anomaly_logs_id_seq'::regclass);


--
-- Name: applicant_approvals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_approvals ALTER COLUMN id SET DEFAULT nextval('public.applicant_approvals_id_seq'::regclass);


--
-- Name: applicant_documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_documents ALTER COLUMN id SET DEFAULT nextval('public.applicant_documents_id_seq'::regclass);


--
-- Name: applicant_education id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_education ALTER COLUMN id SET DEFAULT nextval('public.applicant_education_id_seq'::regclass);


--
-- Name: applicant_family_members id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_family_members ALTER COLUMN id SET DEFAULT nextval('public.applicant_family_members_id_seq'::regclass);


--
-- Name: applicant_interviews id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_interviews ALTER COLUMN id SET DEFAULT nextval('public.applicant_interviews_id_seq'::regclass);


--
-- Name: applicant_requirements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_requirements ALTER COLUMN id SET DEFAULT nextval('public.applicant_requirements_id_seq'::regclass);


--
-- Name: applicant_stage_approvals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_stage_approvals ALTER COLUMN id SET DEFAULT nextval('public.applicant_stage_approvals_id_seq'::regclass);


--
-- Name: applicant_stage_records id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_stage_records ALTER COLUMN id SET DEFAULT nextval('public.applicant_stage_records_id_seq'::regclass);


--
-- Name: applicant_work_experience id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_work_experience ALTER COLUMN id SET DEFAULT nextval('public.applicant_work_experience_id_seq'::regclass);


--
-- Name: applicant_workflow_instances id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_workflow_instances ALTER COLUMN id SET DEFAULT nextval('public.applicant_workflow_instances_id_seq'::regclass);


--
-- Name: applicants id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicants ALTER COLUMN id SET DEFAULT nextval('public.applicants_id_seq'::regclass);


--
-- Name: approval_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approval_logs ALTER COLUMN id SET DEFAULT nextval('public.approval_logs_id_seq'::regclass);


--
-- Name: attendance id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance ALTER COLUMN id SET DEFAULT nextval('public.attendance_id_seq'::regclass);


--
-- Name: attendance_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_logs ALTER COLUMN id SET DEFAULT nextval('public.attendance_logs_id_seq'::regclass);


--
-- Name: attendance_rules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_rules ALTER COLUMN id SET DEFAULT nextval('public.attendance_rules_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: branch_rest_days id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_rest_days ALTER COLUMN id SET DEFAULT nextval('public.branch_rest_days_id_seq'::regclass);


--
-- Name: branches id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches ALTER COLUMN id SET DEFAULT nextval('public.branches_id_seq'::regclass);


--
-- Name: calendar_days id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendar_days ALTER COLUMN id SET DEFAULT nextval('public.calendar_days_id_seq'::regclass);


--
-- Name: company_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_settings ALTER COLUMN id SET DEFAULT nextval('public.company_settings_id_seq'::regclass);


--
-- Name: conversion_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversion_logs ALTER COLUMN id SET DEFAULT nextval('public.conversion_logs_id_seq'::regclass);


--
-- Name: device_log_mappings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.device_log_mappings ALTER COLUMN id SET DEFAULT nextval('public.device_log_mappings_id_seq'::regclass);


--
-- Name: devices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devices ALTER COLUMN id SET DEFAULT nextval('public.devices_id_seq'::regclass);


--
-- Name: email_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_logs ALTER COLUMN id SET DEFAULT nextval('public.email_logs_id_seq'::regclass);


--
-- Name: email_templates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_templates ALTER COLUMN id SET DEFAULT nextval('public.email_templates_id_seq'::regclass);


--
-- Name: employee_approvers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_approvers ALTER COLUMN id SET DEFAULT nextval('public.employee_approvers_id_seq'::regclass);


--
-- Name: employee_deductions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_deductions ALTER COLUMN id SET DEFAULT nextval('public.employee_deductions_id_seq'::regclass);


--
-- Name: employee_device_users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_device_users ALTER COLUMN id SET DEFAULT nextval('public.employee_device_users_id_seq'::regclass);


--
-- Name: employee_education id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_education ALTER COLUMN id SET DEFAULT nextval('public.employee_education_id_seq'::regclass);


--
-- Name: employee_family_members id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_family_members ALTER COLUMN id SET DEFAULT nextval('public.employee_family_members_id_seq'::regclass);


--
-- Name: employee_kpi_evaluations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_kpi_evaluations ALTER COLUMN id SET DEFAULT nextval('public.employee_kpi_evaluations_id_seq'::regclass);


--
-- Name: employee_kpi_scores id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_kpi_scores ALTER COLUMN id SET DEFAULT nextval('public.employee_kpi_scores_id_seq'::regclass);


--
-- Name: employee_leave_balances id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_leave_balances ALTER COLUMN id SET DEFAULT nextval('public.employee_leave_balances_id_seq'::regclass);


--
-- Name: employee_onboarding id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_onboarding ALTER COLUMN id SET DEFAULT nextval('public.employee_onboarding_id_seq'::regclass);


--
-- Name: employee_requirements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_requirements ALTER COLUMN id SET DEFAULT nextval('public.employee_requirements_id_seq'::regclass);


--
-- Name: employee_rest_days id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_rest_days ALTER COLUMN id SET DEFAULT nextval('public.employee_rest_days_id_seq'::regclass);


--
-- Name: employee_rotation_group_assignments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_rotation_group_assignments ALTER COLUMN id SET DEFAULT nextval('public.employee_rotation_group_assignments_id_seq'::regclass);


--
-- Name: employee_salary id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_salary ALTER COLUMN id SET DEFAULT nextval('public.employee_salary_id_seq'::regclass);


--
-- Name: employee_shift_assignments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_shift_assignments ALTER COLUMN id SET DEFAULT nextval('public.employee_shift_assignments_id_seq'::regclass);


--
-- Name: employee_work_experience id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_work_experience ALTER COLUMN id SET DEFAULT nextval('public.employee_work_experience_id_seq'::regclass);


--
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- Name: final_pay id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.final_pay ALTER COLUMN id SET DEFAULT nextval('public.final_pay_id_seq'::regclass);


--
-- Name: forecast_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forecast_logs ALTER COLUMN id SET DEFAULT nextval('public.forecast_logs_id_seq'::regclass);


--
-- Name: hr_form_answers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hr_form_answers ALTER COLUMN id SET DEFAULT nextval('public.hr_form_answers_id_seq'::regclass);


--
-- Name: hr_form_assignments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hr_form_assignments ALTER COLUMN id SET DEFAULT nextval('public.hr_form_assignments_id_seq'::regclass);


--
-- Name: hr_form_fields id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hr_form_fields ALTER COLUMN id SET DEFAULT nextval('public.hr_form_fields_id_seq'::regclass);


--
-- Name: hr_form_submissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hr_form_submissions ALTER COLUMN id SET DEFAULT nextval('public.hr_form_submissions_id_seq'::regclass);


--
-- Name: hr_forms id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hr_forms ALTER COLUMN id SET DEFAULT nextval('public.hr_forms_id_seq'::regclass);


--
-- Name: hr_policy_documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hr_policy_documents ALTER COLUMN id SET DEFAULT nextval('public.hr_policy_documents_id_seq'::regclass);


--
-- Name: job_positions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_positions ALTER COLUMN id SET DEFAULT nextval('public.job_positions_id_seq'::regclass);


--
-- Name: kpi_template_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kpi_template_items ALTER COLUMN id SET DEFAULT nextval('public.kpi_template_items_id_seq'::regclass);


--
-- Name: kpi_templates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kpi_templates ALTER COLUMN id SET DEFAULT nextval('public.kpi_templates_id_seq'::regclass);


--
-- Name: leave_conversions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_conversions ALTER COLUMN id SET DEFAULT nextval('public.leave_conversions_id_seq'::regclass);


--
-- Name: leave_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_types ALTER COLUMN id SET DEFAULT nextval('public.leave_types_id_seq'::regclass);


--
-- Name: leaves id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leaves ALTER COLUMN id SET DEFAULT nextval('public.leaves_id_seq'::regclass);


--
-- Name: man_hour_report_details id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.man_hour_report_details ALTER COLUMN id SET DEFAULT nextval('public.man_hour_report_details_id_seq'::regclass);


--
-- Name: man_hour_reports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.man_hour_reports ALTER COLUMN id SET DEFAULT nextval('public.man_hour_reports_id_seq'::regclass);


--
-- Name: notification_rules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_rules ALTER COLUMN id SET DEFAULT nextval('public.notification_rules_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: overtime_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.overtime_requests ALTER COLUMN id SET DEFAULT nextval('public.overtime_requests_id_seq'::regclass);


--
-- Name: pay_rules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pay_rules ALTER COLUMN id SET DEFAULT nextval('public.pay_rules_id_seq'::regclass);


--
-- Name: payroll id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll ALTER COLUMN id SET DEFAULT nextval('public.payroll_id_seq'::regclass);


--
-- Name: payroll_rules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_rules ALTER COLUMN id SET DEFAULT nextval('public.payroll_rules_id_seq'::regclass);


--
-- Name: payroll_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_settings ALTER COLUMN id SET DEFAULT nextval('public.payroll_settings_id_seq'::regclass);


--
-- Name: raw_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.raw_logs ALTER COLUMN id SET DEFAULT nextval('public.raw_logs_id_seq'::regclass);


--
-- Name: recruitment_workflow_stages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruitment_workflow_stages ALTER COLUMN id SET DEFAULT nextval('public.recruitment_workflow_stages_id_seq'::regclass);


--
-- Name: recruitment_workflows id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruitment_workflows ALTER COLUMN id SET DEFAULT nextval('public.recruitment_workflows_id_seq'::regclass);


--
-- Name: rotation_group_assignments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rotation_group_assignments ALTER COLUMN id SET DEFAULT nextval('public.rotation_group_assignments_id_seq'::regclass);


--
-- Name: rotation_groups id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rotation_groups ALTER COLUMN id SET DEFAULT nextval('public.rotation_groups_id_seq'::regclass);


--
-- Name: rotation_pattern_steps id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rotation_pattern_steps ALTER COLUMN id SET DEFAULT nextval('public.rotation_pattern_steps_id_seq'::regclass);


--
-- Name: rotation_patterns id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rotation_patterns ALTER COLUMN id SET DEFAULT nextval('public.rotation_patterns_id_seq'::regclass);


--
-- Name: shift_schedules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_schedules ALTER COLUMN id SET DEFAULT nextval('public.shift_schedules_id_seq'::regclass);


--
-- Name: smtp_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.smtp_settings ALTER COLUMN id SET DEFAULT nextval('public.smtp_settings_id_seq'::regclass);


--
-- Name: system_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings ALTER COLUMN id SET DEFAULT nextval('public.system_settings_id_seq'::regclass);


--
-- Name: time_modification_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_modification_requests ALTER COLUMN id SET DEFAULT nextval('public.time_modification_requests_id_seq'::regclass);


--
-- Name: user_branch_access id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_branch_access ALTER COLUMN id SET DEFAULT nextval('public.user_branch_access_id_seq'::regclass);


--
-- Name: user_permissions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions ALTER COLUMN id SET DEFAULT nextval('public.user_permissions_id_seq'::regclass);


--
-- Name: user_sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions ALTER COLUMN id SET DEFAULT nextval('public.user_sessions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: _migration_020_repair_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._migration_020_repair_log (id, user_id, permission_key, created_at) FROM stdin;
\.


--
-- Data for Name: anomaly_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.anomaly_logs (id, employee_id, branch_id, anomaly_type, source_module, severity, title, description, detected_value, expected_value, status, detected_at, reviewed_at, resolved_at, reviewed_by, resolved_by, metadata, created_at, updated_at, anomaly_score, confidence, baseline_value, statistical_method) FROM stdin;
\.


--
-- Data for Name: applicant_approvals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.applicant_approvals (id, applicant_id, approved_by, approval_type, decision, comments, decided_at, created_at, updated_at) FROM stdin;
1	3	\N	HIRING	PENDING	Auto-created pending approval from stage progression	\N	2026-06-16 08:34:06.290178	2026-06-16 08:34:06.290178
\.


--
-- Data for Name: applicant_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.applicant_documents (id, applicant_id, document_type, file_url, file_name, uploaded_at) FROM stdin;
\.


--
-- Data for Name: applicant_education; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.applicant_education (id, applicant_id, education_level, school_name, course_or_degree, year_started, year_graduated, honors_awards, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: applicant_family_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.applicant_family_members (id, applicant_id, relationship_type, full_name, birthdate, occupation, contact_number, address, is_dependent, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: applicant_interviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.applicant_interviews (id, applicant_id, interview_date, interviewer, interview_type, notes, rating, status, created_at, updated_at, interviewer_user_id, recommendation) FROM stdin;
1	3	2026-06-16 08:34:06.184	\N	Initial Interview	Auto-created on stage progression	\N	COMPLETED	2026-06-16 08:34:06.188008	2026-06-16 08:34:06.188008	\N	\N
2	3	2026-06-16 08:34:06.22	\N	Exam Interview	Auto-created on stage progression	\N	COMPLETED	2026-06-16 08:34:06.221873	2026-06-16 08:34:06.221873	\N	\N
3	3	2026-06-16 08:34:06.254	\N	Final Interview	Auto-created on stage progression	\N	COMPLETED	2026-06-16 08:34:06.256412	2026-06-16 08:34:06.256412	\N	\N
\.


--
-- Data for Name: applicant_requirements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.applicant_requirements (id, applicant_id, requirement_name, status, remarks, submitted_date, verified_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: applicant_stage_approvals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.applicant_stage_approvals (id, applicant_id, stage_record_id, workflow_stage_id, approver_employee_id, approval_level, decision, comments, decided_at, created_at, updated_at, assigned_user_id, assigned_employee_id, scheduled_at, assigned_at, assigned_by) FROM stdin;
\.


--
-- Data for Name: applicant_stage_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.applicant_stage_records (id, applicant_id, workflow_instance_id, workflow_stage_id, stage_name, stage_type, assigned_user_id, assigned_employee_id, status, score, recommendation, comments, scheduled_at, completed_at, attempt_number, is_current, result_data, created_at, updated_at) FROM stdin;
1	1	1	1	Initial Interview	INTERVIEW	2	1	COMPLETED	80.00	PASSED	Passed on initial interview	2026-06-12 10:54:00	2026-06-12 18:55:52.492375	1	f	\N	2026-06-12 18:53:25.632489	2026-06-12 18:55:52.492375
2	1	1	2	Technical Test	EXAM	2	1	COMPLETED	75.00	PASSED	He passed on technical exam	2026-06-12 11:05:00	2026-06-12 19:06:51.735773	1	f	\N	2026-06-12 19:05:51.547175	2026-06-12 19:06:51.735773
4	1	1	4	Passing Documents	DOCUMENT_CHECK	2	1	COMPLETED	\N	PASSED	\N	2026-06-12 11:12:00	2026-06-13 14:04:10.529973	1	f	\N	2026-06-12 19:11:39.796381	2026-06-13 14:04:10.529973
7	2	2	1	Initial Interview	INTERVIEW	2	1	COMPLETED	80.00	PASSED	\N	2026-06-13 07:02:00	2026-06-13 15:03:21.438174	1	f	\N	2026-06-13 15:02:45.404249	2026-06-13 15:03:21.438174
8	2	2	2	Technical Test	EXAM	2	1	COMPLETED	90.00	PASSED	\N	2026-06-13 07:03:00	2026-06-13 15:04:11.718897	1	f	\N	2026-06-13 15:03:22.802774	2026-06-13 15:04:11.718897
6	1	1	5	Completed Applicant	CONVERT_TO_EMPLOYEE	\N	\N	COMPLETED	\N	PASSED	Rescheduled for next week	2026-06-20 10:00:00	2026-06-13 14:56:39.749372	1	f	\N	2026-06-13 14:04:11.726259	2026-06-13 15:20:11.540851
3	1	1	3	Final Interview	INTERVIEW	2	1	SCHEDULED	\N	PASSED	Assigned interviewer after scheduling	2026-06-13 10:00:00	2026-06-12 19:11:37.912686	1	f	\N	2026-06-12 19:06:53.069004	2026-06-13 15:32:49.320946
9	2	2	3	Final Interview	INTERVIEW	2	1	COMPLETED	\N	PASSED	\N	2026-06-13 07:05:00	2026-06-13 15:36:04.98982	1	f	\N	2026-06-13 15:04:12.719725	2026-06-13 15:36:04.98982
10	2	2	4	Passing Documents	DOCUMENT_CHECK	2	1	COMPLETED	\N	PASSED	\N	2026-06-13 07:36:00	2026-06-13 15:36:40.91663	1	f	\N	2026-06-13 15:36:06.365335	2026-06-13 15:36:40.91663
11	2	2	5	Completed Applicant	CONVERT_TO_EMPLOYEE	2	1	COMPLETED	\N	PASSED	\N	2026-06-13 07:36:00	2026-06-13 15:37:03.150876	1	f	\N	2026-06-13 15:36:41.972633	2026-06-13 15:37:03.150876
12	3	3	1	Initial Interview	INTERVIEW	2	1	COMPLETED	10.00	PASSED	\N	2026-06-16 00:10:00	2026-06-16 08:10:51.982119	1	f	\N	2026-06-16 08:10:01.66183	2026-06-16 08:10:51.982119
13	3	3	2	Technical Test	EXAM	2	1	COMPLETED	70.00	PASSED	\N	2026-06-16 00:11:00	2026-06-16 08:11:49.056694	1	f	\N	2026-06-16 08:10:54.28869	2026-06-16 08:11:49.056694
14	3	3	3	Final Interview	INTERVIEW	2	1	COMPLETED	100.00	PASSED	\N	2026-06-16 00:11:00	2026-06-16 08:12:12.913582	1	f	\N	2026-06-16 08:11:51.07755	2026-06-16 08:12:12.913582
15	3	3	4	Passing Documents	DOCUMENT_CHECK	2	1	COMPLETED	100.00	PASSED	\N	2026-06-16 00:12:00	2026-06-16 08:12:45.217251	1	f	\N	2026-06-16 08:12:14.469716	2026-06-16 08:12:45.217251
16	3	3	5	Completed Applicant	CONVERT_TO_EMPLOYEE	\N	\N	COMPLETED	\N	PASSED	\N	\N	2026-06-16 08:13:10.087314	1	f	\N	2026-06-16 08:12:46.896441	2026-06-16 08:13:10.087314
\.


--
-- Data for Name: applicant_work_experience; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.applicant_work_experience (id, applicant_id, company_name, "position", start_date, end_date, reason_for_leaving, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: applicant_workflow_instances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.applicant_workflow_instances (id, applicant_id, workflow_id, current_stage_id, status, workflow_snapshot, started_at, completed_at, created_at, updated_at) FROM stdin;
1	1	1	5	COMPLETED	{"stages": [{"id": 1, "allow_skip": false, "stage_name": "Initial Interview", "stage_type": "INTERVIEW", "is_required": true, "is_terminal": false, "passing_score": null, "requires_score": false, "sequence_order": 1, "days_to_complete": null, "requires_approval": false, "requires_assignment": false, "auto_proceed_on_pass": false}, {"id": 2, "allow_skip": false, "stage_name": "Technical Test", "stage_type": "EXAM", "is_required": true, "is_terminal": false, "passing_score": "70.00", "requires_score": true, "sequence_order": 2, "days_to_complete": null, "requires_approval": false, "requires_assignment": true, "auto_proceed_on_pass": false}, {"id": 3, "allow_skip": false, "stage_name": "Final Interview", "stage_type": "INTERVIEW", "is_required": true, "is_terminal": false, "passing_score": null, "requires_score": false, "sequence_order": 3, "days_to_complete": null, "requires_approval": false, "requires_assignment": false, "auto_proceed_on_pass": false}, {"id": 4, "allow_skip": false, "stage_name": "Passing Documents", "stage_type": "DOCUMENT_CHECK", "is_required": true, "is_terminal": false, "passing_score": null, "requires_score": false, "sequence_order": 4, "days_to_complete": null, "requires_approval": false, "requires_assignment": false, "auto_proceed_on_pass": false}, {"id": 5, "allow_skip": false, "stage_name": "Completed Applicant", "stage_type": "CONVERT_TO_EMPLOYEE", "is_required": true, "is_terminal": true, "passing_score": null, "requires_score": false, "sequence_order": 5, "days_to_complete": null, "requires_approval": false, "requires_assignment": false, "auto_proceed_on_pass": false}], "workflow": {"id": 1, "name": "Standard", "version": 1, "is_active": true, "is_default": true, "description": null}}	2026-06-12 18:53:25.632489	2026-06-13 14:56:41.806278	2026-06-12 18:53:25.632489	2026-06-13 14:56:41.806278
2	2	1	5	COMPLETED	{"stages": [{"id": 1, "allow_skip": false, "stage_name": "Initial Interview", "stage_type": "INTERVIEW", "is_required": true, "is_terminal": false, "passing_score": null, "requires_score": false, "sequence_order": 1, "days_to_complete": null, "requires_approval": false, "requires_assignment": false, "auto_proceed_on_pass": false}, {"id": 2, "allow_skip": false, "stage_name": "Technical Test", "stage_type": "EXAM", "is_required": true, "is_terminal": false, "passing_score": "70.00", "requires_score": true, "sequence_order": 2, "days_to_complete": null, "requires_approval": false, "requires_assignment": true, "auto_proceed_on_pass": false}, {"id": 3, "allow_skip": false, "stage_name": "Final Interview", "stage_type": "INTERVIEW", "is_required": true, "is_terminal": false, "passing_score": null, "requires_score": false, "sequence_order": 3, "days_to_complete": null, "requires_approval": false, "requires_assignment": false, "auto_proceed_on_pass": false}, {"id": 4, "allow_skip": false, "stage_name": "Passing Documents", "stage_type": "DOCUMENT_CHECK", "is_required": true, "is_terminal": false, "passing_score": null, "requires_score": false, "sequence_order": 4, "days_to_complete": null, "requires_approval": false, "requires_assignment": false, "auto_proceed_on_pass": false}, {"id": 5, "allow_skip": false, "stage_name": "Completed Applicant", "stage_type": "CONVERT_TO_EMPLOYEE", "is_required": true, "is_terminal": true, "passing_score": null, "requires_score": false, "sequence_order": 5, "days_to_complete": null, "requires_approval": false, "requires_assignment": false, "auto_proceed_on_pass": false}], "workflow": {"id": 1, "name": "Standard", "version": 1, "is_active": true, "is_default": true, "description": null}}	2026-06-13 15:02:45.404249	2026-06-13 15:37:04.467173	2026-06-13 15:02:45.404249	2026-06-13 15:37:04.467173
3	3	1	5	COMPLETED	{"stages": [{"id": 1, "allow_skip": false, "stage_name": "Initial Interview", "stage_type": "INTERVIEW", "is_required": true, "is_terminal": false, "passing_score": null, "requires_score": false, "sequence_order": 1, "days_to_complete": null, "requires_approval": false, "requires_assignment": false, "auto_proceed_on_pass": false}, {"id": 2, "allow_skip": false, "stage_name": "Technical Test", "stage_type": "EXAM", "is_required": true, "is_terminal": false, "passing_score": "70.00", "requires_score": true, "sequence_order": 2, "days_to_complete": null, "requires_approval": false, "requires_assignment": true, "auto_proceed_on_pass": false}, {"id": 3, "allow_skip": false, "stage_name": "Final Interview", "stage_type": "INTERVIEW", "is_required": true, "is_terminal": false, "passing_score": null, "requires_score": false, "sequence_order": 3, "days_to_complete": null, "requires_approval": false, "requires_assignment": false, "auto_proceed_on_pass": false}, {"id": 4, "allow_skip": false, "stage_name": "Passing Documents", "stage_type": "DOCUMENT_CHECK", "is_required": true, "is_terminal": false, "passing_score": null, "requires_score": false, "sequence_order": 4, "days_to_complete": null, "requires_approval": false, "requires_assignment": false, "auto_proceed_on_pass": false}, {"id": 5, "allow_skip": false, "stage_name": "Completed Applicant", "stage_type": "CONVERT_TO_EMPLOYEE", "is_required": true, "is_terminal": true, "passing_score": null, "requires_score": false, "sequence_order": 5, "days_to_complete": null, "requires_approval": false, "requires_assignment": false, "auto_proceed_on_pass": false}], "workflow": {"id": 1, "name": "Standard", "version": 1, "is_active": true, "is_default": true, "description": null}}	2026-06-16 08:10:01.66183	2026-06-16 08:13:16.617712	2026-06-16 08:10:01.66183	2026-06-16 08:13:16.617712
\.


--
-- Data for Name: applicants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.applicants (id, job_position_id, first_name, middle_name, last_name, suffix, email, phone, address, resume_url, status, rating, source, notes, applied_date, created_at, updated_at, employee_id, workflow_instance_id) FROM stdin;
1	1	Sam	Taneo	Empuerto	\N	empuertojohnellchess@gmail.com	09690622194	Cebu City	\N	Initial	\N	LinkedIn	\N	2026-06-12	2026-06-12 18:53:25.577783	2026-06-12 18:53:25.632489	\N	1
2	1	hgh	Lastimosa	Empuerto	Sr.	empuertojohnellchess@gmail.com	09690622194	purok gumamela	\N	Initial	\N	LinkedIn	\N	2026-06-13	2026-06-13 15:02:45.287049	2026-06-13 15:02:45.404249	\N	2
3	1	dada	Enot	Empuerto	\N	empuertojohnellchess@gmail.com	09690622194	purok gumamela	\N	Initial	\N	LinkedIn	\N	2026-06-16	2026-06-16 08:10:01.599801	2026-06-16 08:34:05.816075	10	3
\.


--
-- Data for Name: approval_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.approval_logs (id, request_type, request_id, employee_id, approved_by, role, action, remarks, created_at) FROM stdin;
\.


--
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance (id, employee_id, check_in_time, check_out_time, date, status, created_at, work_fraction, half_day_type, shift_id, shift_date, source, branch_id, timezone_used, device_id, check_in_time_utc, check_out_time_utc) FROM stdin;
1	11	\N	\N	2026-06-17	LEAVE	2026-06-16 12:30:37.8388	0	\N	\N	\N	BIOMETRIC	\N	\N	\N	\N	\N
2	11	\N	\N	2026-06-18	LEAVE	2026-06-16 12:30:37.8388	0	\N	\N	\N	BIOMETRIC	\N	\N	\N	\N	\N
\.


--
-- Data for Name: attendance_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance_logs (id, raw_log_id, device_id, employee_code, employee_id, log_timestamp, status, error_message, processed_at, created_at) FROM stdin;
\.


--
-- Data for Name: attendance_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance_rules (id, late_threshold, grace_period, max_work_hours, created_at, late_deduction_type, late_deduction_value, late_deduction_enabled, is_active) FROM stdin;
2	30	15	10	2026-06-10 12:08:28.953323	PER_MINUTE	5.50	t	t
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, employee_id, branch_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent, description, created_at) FROM stdin;
1	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Successful login: admin	2026-06-10 09:30:56.483598+08
2	2	\N	\N	INSERT	smtp_settings	1	\N	{"host": "smtp.gmail.com", "port": 587, "is_active": true, "from_email": "empuertojohnellchess@gmail.com"}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	SMTP settings created: smtp.gmail.com:587	2026-06-10 09:40:10.997682+08
3	2	\N	\N	UPDATE	system_settings	\N	\N	{"key": "employee_code_padding", "value": "0"}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	System setting updated: employee_code_padding = 0	2026-06-10 09:43:06.990198+08
4	2	\N	\N	UPDATE	system_settings	\N	\N	{"key": "employee_code_padding", "value": "3"}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	System setting updated: employee_code_padding = 3	2026-06-10 09:43:09.523903+08
5	2	2	\N	INSERT	employees	2	\N	{"status": "ACTIVE", "position": "Software Engineer", "branch_id": null, "last_name": "Empuerto", "department": "Engineering", "first_name": "Johnell", "employee_code": "EMP001", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Employee created: Johnell Empuerto (EMP001) - REGULAR	2026-06-10 09:45:35.981042+08
6	2	\N	1	INSERT	branches	1	\N	{"city": "BARILI", "code": "MAINBRANCH-001", "name": "Cebu Branch", "phone": "09690622194", "address": "Purok Gumamela, Tal-ot", "province": "CEBU", "timezone": "Asia/Manila", "is_active": true}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Branch created: Cebu Branch (MAINBRANCH-001)	2026-06-10 09:50:14.616681+08
7	2	2	\N	UPDATE	employees	2	{"status": "ACTIVE", "position": "Software Engineer", "branch_id": null, "last_name": "Empuerto", "department": "Engineering", "first_name": "Johnell", "employee_code": "EMP001", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	{"status": "ACTIVE", "position": "Software Engineer", "branch_id": null, "last_name": "Empuerto", "department": "Engineering", "first_name": "Johnell", "employee_code": "EMP001", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Employee updated: Johnell Empuerto (EMP001)	2026-06-10 09:51:01.248524+08
8	2	2	\N	UPDATE	employees	2	{"status": "ACTIVE", "position": "Software Engineer", "branch_id": null, "last_name": "Empuerto", "department": "Engineering", "first_name": "Johnell", "employee_code": "EMP001", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	{"status": "ACTIVE", "position": "Software Engineer", "branch_id": null, "last_name": "Empuerto", "department": "Engineering", "first_name": "Johnell", "employee_code": "EMP001", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Employee updated: Johnell Empuerto (EMP001)	2026-06-10 09:51:23.818892+08
9	2	2	\N	UPDATE	employees	2	{"status": "ACTIVE", "position": "Software Engineer", "branch_id": null, "last_name": "Empuerto", "department": "Engineering", "first_name": "Johnell", "employee_code": "EMP001", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	{"status": "ACTIVE", "position": "Software Engineer", "branch_id": null, "last_name": "Empuerto", "department": "Engineering", "first_name": "Johnell", "employee_code": "EMP001", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Employee updated: Johnell Empuerto (EMP001)	2026-06-10 09:52:40.702925+08
10	2	2	\N	UPDATE	employees	2	{"status": "ACTIVE", "position": "Software Engineer", "branch_id": null, "last_name": "Empuerto", "department": "Engineering", "first_name": "Johnell", "employee_code": "EMP001", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	{"status": "ACTIVE", "position": "Software Engineer", "branch_id": null, "last_name": "Empuerto", "department": "Engineering", "first_name": "Johnell", "employee_code": "EMP001", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Employee updated: Johnell Empuerto (EMP001)	2026-06-10 09:52:49.105279+08
11	2	1	\N	UPDATE	employees	1	{"status": "ACTIVE", "position": "System Administrator", "branch_id": null, "last_name": "Administrator", "department": "Administration", "first_name": "System", "employee_code": "ADMIN001", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	{"status": "ACTIVE", "position": "System Administrator", "branch_id": null, "last_name": "Administrator", "department": "Administration", "first_name": "System", "employee_code": "ADMIN001", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Employee updated: System Administrator (ADMIN001)	2026-06-10 09:52:57.578239+08
12	2	2	\N	UPDATE	employees	2	{"status": "ACTIVE", "position": "Software Engineer", "branch_id": null, "last_name": "Empuerto", "department": "Engineering", "first_name": "Johnell", "employee_code": "EMP001", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	{"status": "ACTIVE", "position": "Software Engineer", "branch_id": null, "last_name": "Empuerto", "department": "Engineering", "first_name": "Johnell", "employee_code": "EMP001", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Employee updated: Johnell Empuerto (EMP001)	2026-06-10 10:05:13.190971+08
13	2	2	\N	UPDATE	employees	2	{"status": "ACTIVE", "position": "Software Engineer", "branch_id": null, "last_name": "Empuerto", "department": "Engineering", "first_name": "Johnell", "employee_code": "EMP001", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	{"status": "ACTIVE", "position": "Software Engineer", "branch_id": null, "last_name": "Empuerto", "department": "Engineering", "first_name": "Johnell", "employee_code": "EMP001", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Employee updated: Johnell Empuerto (EMP001)	2026-06-10 10:05:36.933993+08
28	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 10:56:05.580559+08
14	2	2	\N	UPDATE	employees	2	{"status": "ACTIVE", "position": "Software Engineer", "branch_id": null, "last_name": "Empuerto", "department": "Engineering", "first_name": "Johnell", "employee_code": "EMP001", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	{"status": "ACTIVE", "position": "Software Engineer", "branch_id": null, "last_name": "Empuerto", "department": "Engineering", "first_name": "Johnell", "employee_code": "EMP001", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Employee updated: Johnell Empuerto (EMP001)	2026-06-10 10:06:11.944905+08
15	2	2	\N	UPDATE	employees	2	{"status": "ACTIVE", "position": "Software Engineer", "branch_id": null, "last_name": "Empuerto", "department": "Engineering", "first_name": "Johnell", "employee_code": "EMP001", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	{"status": "ACTIVE", "position": "Software Engineer", "branch_id": null, "last_name": "Empuerto", "department": "Engineering", "first_name": "Johnell", "employee_code": "EMP001", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Employee updated: Johnell Empuerto (EMP001)	2026-06-10 10:11:06.156589+08
16	2	2	\N	UPDATE	employees	2	{"status": "ACTIVE", "position": "Software Engineer", "branch_id": null, "last_name": "Empuerto", "department": "Engineering", "first_name": "Johnell", "employee_code": "EMP001", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	{"status": "ACTIVE", "position": "Software Engineer", "branch_id": null, "last_name": "Empuerto", "department": "Engineering", "first_name": "Johnell", "employee_code": "EMP001", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Employee updated: Johnell Empuerto (EMP001)	2026-06-10 10:11:40.55552+08
17	2	2	\N	UPDATE	employees	2	{"status": "ACTIVE", "position": "Software Engineer", "branch_id": null, "last_name": "Empuerto", "department": "Engineering", "first_name": "Johnell", "employee_code": "EMP001", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	{"status": "ACTIVE", "position": "Software Engineer", "branch_id": null, "last_name": "Empuerto", "department": "Engineering", "first_name": "Johnell", "employee_code": "EMP001", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Employee updated: Johnell Empuerto (EMP001)	2026-06-10 10:12:52.019847+08
18	2	2	\N	UPDATE	employees	2	{"status": "ACTIVE", "position": "Software Engineer", "branch_id": null, "last_name": "Empuerto", "department": "Engineering", "first_name": "Johnell", "employee_code": "EMP001", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	{"status": "ACTIVE", "position": "Software Engineer", "branch_id": null, "last_name": "Empuerto", "department": "Engineering", "first_name": "Johnell", "employee_code": "EMP001", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Employee updated: Johnell Empuerto (EMP001)	2026-06-10 10:13:16.56737+08
19	2	3	1	INSERT	employees	3	\N	{"status": "ACTIVE", "position": "Software Engineer", "branch_id": 1, "last_name": "Empuerto", "department": "Production", "first_name": "Johnellssss", "employee_code": "EMP002", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Employee created: Johnellssss Empuerto (EMP002) - REGULAR	2026-06-10 10:23:36.81386+08
20	2	3	1	UPDATE	employees	3	{"status": "ACTIVE", "position": "Software Engineer", "branch_id": 1, "last_name": "Empuerto", "department": "Production", "first_name": "Johnellssss", "employee_code": "EMP002", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	{"status": "ACTIVE", "position": "Software Engineer", "branch_id": 1, "last_name": "Empuerto", "department": "Production", "first_name": "Johnellssss", "employee_code": "EMP002", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Employee updated: Johnellssss Empuerto (EMP002)	2026-06-10 10:36:50.235701+08
21	2	2	1	UPDATE	employees	2	{"status": "ACTIVE", "position": "Software Engineer", "branch_id": null, "last_name": "Empuerto", "department": "Engineering", "first_name": "Johnell", "employee_code": "EMP001", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	{"status": "ACTIVE", "position": "Software Engineer", "branch_id": 1, "last_name": "Empuerto", "department": "Engineering", "first_name": "Johnell", "employee_code": "EMP001", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Employee updated: Johnell Empuerto (EMP001)	2026-06-10 10:36:55.191335+08
22	2	\N	\N	INSERT	attendance_rules	1	\N	{"is_active": false, "grace_period": 0, "late_threshold": 0, "max_work_hours": 8, "late_deduction_type": "PER_MINUTE", "late_deduction_value": "0.50", "late_deduction_enabled": true}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	New attendance rule created	2026-06-10 10:38:41.109666+08
23	2	\N	\N	INSERT	pay_rules	1	\N	{"day_type": "REGULAR", "multiplier": "1.00"}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Pay rule created: REGULAR (1.00x)	2026-06-10 10:39:41.411933+08
24	2	\N	\N	INSERT	pay_rules	2	\N	{"day_type": "SPECIAL_NON_WORKING", "multiplier": "2.00"}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Pay rule created: SPECIAL_NON_WORKING (2.00x)	2026-06-10 10:39:58.990558+08
25	2	\N	\N	INSERT	pay_rules	3	\N	{"day_type": "SPECIAL_HOLIDAY", "multiplier": "3.00"}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Pay rule created: SPECIAL_HOLIDAY (3.00x)	2026-06-10 10:40:06.162661+08
26	2	\N	\N	INSERT	pay_rules	4	\N	{"day_type": "REGULAR_HOLIDAY", "multiplier": "4.00"}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Pay rule created: REGULAR_HOLIDAY (4.00x)	2026-06-10 10:40:16.60993+08
27	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 10:55:57.436518+08
29	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 10:56:13.433592+08
32	2	\N	\N	UPDATE	user_permissions	3	\N	\N	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Permissions updated for user 3: 12 → 11 permissions	2026-06-10 10:56:23.366168+08
33	2	2	\N	UPDATE	users	3	{"role": "EMPLOYEE", "username": "testuser"}	{"role": "EMPLOYEE", "username": "testuser2"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	User updated: testuser2	2026-06-10 10:56:23.399259+08
34	2	\N	\N	UPDATE	user_permissions	3	\N	\N	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Permissions reset to Employee Default for user 3 (username: testuser2)	2026-06-10 10:56:23.421079+08
35	2	\N	\N	DELETE	users	3	{"role": "EMPLOYEE", "username": "testuser2", "employee_id": 2}	\N	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	User deleted: testuser2	2026-06-10 10:56:23.449519+08
30	2	2	\N	INSERT	users	3	\N	{"role": "EMPLOYEE", "username": "testuser", "employee_id": 2}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	User created: testuser	2026-06-10 10:56:13.54713+08
31	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 10:56:23.315059+08
36	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 10:56:48.917023+08
37	2	\N	\N	UPDATE	user_permissions	2	\N	\N	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Attempted to reset ADMIN permissions for user 2 (username: admin) — blocked	2026-06-10 10:56:48.974977+08
38	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 10:56:59.199847+08
39	2	3	\N	INSERT	users	4	\N	{"role": "EMPLOYEE", "username": "roletest", "employee_id": 3}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	User created: roletest	2026-06-10 10:56:59.341915+08
40	2	3	\N	UPDATE	users	4	{"role": "EMPLOYEE", "username": "roletest"}	{"role": "ADMIN", "username": "roletest"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	User updated: roletest	2026-06-10 10:56:59.375534+08
41	2	3	\N	UPDATE	users	4	{"role": "ADMIN", "username": "roletest"}	{"role": "EMPLOYEE", "username": "roletest"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	User updated: roletest	2026-06-10 10:56:59.393585+08
42	2	\N	\N	DELETE	users	4	{"role": "EMPLOYEE", "username": "roletest", "employee_id": 3}	\N	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	User deleted: roletest	2026-06-10 10:56:59.419929+08
43	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 10:57:56.505836+08
44	2	\N	\N	UPDATE	user_permissions	2	\N	\N	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Attempted to reset ADMIN permissions for user 2 (username: admin) — blocked	2026-06-10 10:57:56.569328+08
45	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 11:05:21.312778+08
46	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 11:05:31.953013+08
47	2	\N	2	INSERT	branches	2	\N	{"city": "Test City", "code": "TEST-BRN-001", "name": "Test Branch", "phone": "1234567890", "address": "123 Test St", "province": "Test Province", "timezone": "Asia/Tokyo", "is_active": true}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Branch created: Test Branch (TEST-BRN-001)	2026-06-10 11:05:32.0351+08
48	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 11:05:44.40638+08
49	2	\N	2	UPDATE	branches	2	{"city": "Test City", "code": "TEST-BRN-001", "name": "Test Branch", "phone": "1234567890", "address": "123 Test St", "province": "Test Province", "timezone": "Asia/Tokyo", "is_active": true}	{"city": "New City", "code": "TEST-BRN-001-UPDATED", "name": "Updated Branch", "phone": "9876543210", "address": "456 New St", "province": "New Province", "timezone": "Asia/Singapore", "is_active": true}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Branch updated: Updated Branch (TEST-BRN-001-UPDATED)	2026-06-10 11:05:44.481358+08
50	2	\N	2	UPDATE	branches	2	{"is_active": true}	{"is_active": false}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Branch Updated Branch deactivated	2026-06-10 11:05:44.566164+08
51	2	\N	2	UPDATE	branches	2	{"is_active": false}	{"is_active": true}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Branch Updated Branch activated	2026-06-10 11:05:44.583802+08
52	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 11:06:08.616152+08
53	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 11:06:16.963196+08
54	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 11:06:36.929319+08
55	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 11:07:13.052689+08
56	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 11:07:24.210526+08
57	2	\N	2	UPDATE	branches	2	{"is_active": true}	{"is_active": false}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Branch Updated Branch deactivated	2026-06-10 11:07:24.283485+08
58	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Successful login: admin	2026-06-10 11:11:41.637293+08
59	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 11:14:10.996681+08
60	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 11:14:22.792925+08
61	2	4	1	INSERT	employees	4	\N	{"status": "ACTIVE", "position": "Tester", "branch_id": 1, "last_name": "User", "department": "Engineering", "first_name": "Test", "employee_code": "TEST001", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Employee created: Test User (TEST001) - REGULAR	2026-06-10 11:14:22.893874+08
62	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 11:14:32.197887+08
63	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 11:14:43.864006+08
64	2	4	1	EMPLOYMENT_STATUS_CHANGED	employees	4	{"status": "ACTIVE", "position": "Tester", "branch_id": 1, "last_name": "User", "department": "Engineering", "first_name": "Test", "employee_code": "TEST001", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	{"status": "ACTIVE", "position": "Senior Tester", "branch_id": 1, "last_name": null, "department": null, "first_name": null, "employee_code": "TEST001", "employment_status": null, "regularization_date": null, "probation_period_months": null}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Employment status changed: null null - REGULAR → null	2026-06-10 11:14:43.958721+08
65	2	5	1	INSERT	employees	5	\N	{"status": "ACTIVE", "position": "Tester", "branch_id": 1, "last_name": "User", "department": "Engineering", "first_name": "NoBranch", "employee_code": "TEST002", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Employee created: NoBranch User (TEST002) - REGULAR	2026-06-10 11:14:43.992184+08
66	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 11:15:26.531375+08
67	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 11:15:33.740562+08
68	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 11:15:55.586496+08
69	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 11:21:45.045856+08
70	2	4	1	DELETE	employees	4	{"last_name": null, "first_name": null, "employee_code": "TEST001"}	\N	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Employee deleted: null null (TEST001)	2026-06-10 11:21:45.140329+08
71	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 11:21:56.555733+08
72	2	4	1	DELETE	employees	4	{"last_name": null, "first_name": null, "employee_code": "TEST001"}	\N	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Employee deleted: null null (TEST001)	2026-06-10 11:21:56.633026+08
73	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 11:22:18.54178+08
74	2	6	1	INSERT	employees	6	\N	{"status": "ACTIVE", "position": "Tester", "branch_id": 1, "last_name": "Test", "department": "QA", "first_name": "NullBranch", "employee_code": "TEST003", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Employee created: NullBranch Test (TEST003) - REGULAR	2026-06-10 11:22:18.638586+08
75	2	5	1	EMPLOYMENT_STATUS_CHANGED	employees	5	{"status": "ACTIVE", "position": "Tester", "branch_id": 1, "last_name": "User", "department": "Engineering", "first_name": "NoBranch", "employee_code": "TEST002", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	{"status": "ACTIVE", "position": null, "branch_id": 1, "last_name": null, "department": null, "first_name": null, "employee_code": "TEST002", "employment_status": null, "regularization_date": null, "probation_period_months": null}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Employment status changed: null null - REGULAR → null	2026-06-10 11:22:18.674172+08
76	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 11:22:36.620231+08
77	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 11:22:36.90611+08
78	2	7	1	INSERT	employees	7	\N	{"status": "ACTIVE", "position": "Tester", "branch_id": 1, "last_name": "Fixed", "department": "QA", "first_name": "NullBranch", "employee_code": "TEST004", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Employee created: NullBranch Fixed (TEST004) - REGULAR	2026-06-10 11:22:36.946682+08
79	2	7	1	DELETE	employees	7	{"last_name": "Fixed", "first_name": "NullBranch", "employee_code": "TEST004"}	\N	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Employee deleted: NullBranch Fixed (TEST004)	2026-06-10 11:22:36.979709+08
80	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 11:25:38.341862+08
81	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 11:34:08.202065+08
82	2	8	1	INSERT	employees	8	\N	{"status": "ACTIVE", "position": "Tester", "branch_id": 1, "last_name": "Create", "department": "QA", "first_name": "NullBranch", "employee_code": "FIXTEST1", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Employee created: NullBranch Create (FIXTEST1) - REGULAR	2026-06-10 11:34:08.290113+08
83	2	8	1	DELETE	employees	8	{"last_name": "Create", "first_name": "NullBranch", "employee_code": "FIXTEST1"}	\N	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Employee deleted: NullBranch Create (FIXTEST1)	2026-06-10 11:34:08.422589+08
84	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 11:34:45.991025+08
85	2	9	1	INSERT	employees	9	\N	{"status": "ACTIVE", "position": "Tester", "branch_id": 1, "last_name": "Check", "department": "QA", "first_name": "Final", "employee_code": "FIXTEST2", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Employee created: Final Check (FIXTEST2) - REGULAR	2026-06-10 11:34:46.08934+08
86	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 11:34:58.502469+08
87	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 11:35:05.427669+08
88	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 11:35:53.152216+08
89	2	9	1	DELETE	employees	9	{"last_name": "Check", "first_name": "Final", "employee_code": "FIXTEST2"}	\N	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Employee deleted: Final Check (FIXTEST2)	2026-06-10 11:35:53.232882+08
90	2	6	1	DELETE	employees	6	{"last_name": "Test", "first_name": "NullBranch", "employee_code": "TEST003"}	\N	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Employee deleted: NullBranch Test (TEST003)	2026-06-10 11:35:53.247205+08
91	2	5	1	DELETE	employees	5	{"last_name": null, "first_name": null, "employee_code": "TEST002"}	\N	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Employee deleted: null null (TEST002)	2026-06-10 11:35:53.256916+08
92	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Successful login: admin	2026-06-10 11:39:04.819654+08
93	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 11:47:03.468138+08
94	2	\N	\N	INSERT	calendar_days	1	\N	{"date": "2026-06-12", "day_type": "REGULAR_HOLIDAY", "branch_id": null, "description": "Independence Day"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Calendar day created: 2026-06-12 (REGULAR_HOLIDAY)	2026-06-10 11:47:03.569355+08
95	2	\N	1	INSERT	calendar_days	2	\N	{"date": "2026-06-19", "day_type": "SPECIAL_NON_WORKING", "branch_id": 1, "description": "Local holiday"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Calendar day created: 2026-06-19 (SPECIAL_NON_WORKING)	2026-06-10 11:47:03.593712+08
96	2	\N	\N	INSERT	calendar_days	3	\N	{"date": "2026-06-25", "day_type": "SPECIAL_HOLIDAY", "branch_id": null, "description": "Local special day"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Calendar day created: 2026-06-25 (SPECIAL_HOLIDAY)	2026-06-10 11:47:03.612487+08
97	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 11:47:24.725049+08
98	2	\N	\N	UPDATE	calendar_days	1	\N	{"date": "2026-06-11T16:00:00.000Z", "day_type": "REGULAR_HOLIDAY", "branch_id": null, "description": "Independence Day (Updated)"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Calendar day updated: Fri Jun 12 2026 00:00:00 GMT+0800 (Philippine Standard Time)	2026-06-10 11:47:24.891947+08
99	2	\N	\N	DELETE	calendar_days	3	\N	\N	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Calendar day deleted (id: 3)	2026-06-10 11:47:24.906808+08
100	2	\N	\N	INSERT	calendar_days	4	\N	{"date": "2026-06-15", "day_type": "REGULAR", "branch_id": null, "description": "Regular Monday"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Calendar day created: 2026-06-15 (REGULAR)	2026-06-10 11:47:24.926117+08
101	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 11:47:41.270312+08
102	2	\N	1	INSERT	calendar_days	5	\N	{"date": "2026-06-12", "day_type": "SPECIAL_NON_WORKING", "branch_id": 1, "description": "Branch-specific June 12"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Calendar day created: 2026-06-12 (SPECIAL_NON_WORKING)	2026-06-10 11:47:41.35869+08
103	2	\N	1	INSERT	calendar_days	6	\N	{"date": "2026-06-26", "day_type": "REGULAR", "branch_id": 1, "description": "Branch regular day"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Calendar day created: 2026-06-26 (REGULAR)	2026-06-10 11:47:41.380442+08
104	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 11:47:59.371401+08
105	2	\N	\N	BULK_UPLOAD	calendar_days	\N	\N	{"skipped": 0, "updated": 0, "inserted": 2, "total_rows": 2}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Bulk calendar upload: 2 inserted, 0 updated, 0 skipped	2026-06-10 11:47:59.438857+08
106	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 11:48:10.115924+08
107	2	\N	\N	BULK_UPLOAD	calendar_days	\N	\N	{"skipped": 0, "updated": 1, "inserted": 0, "total_rows": 1}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Bulk calendar upload: 0 inserted, 1 updated, 0 skipped	2026-06-10 11:48:10.260952+08
108	2	\N	\N	BULK_UPLOAD	calendar_days	\N	\N	{"skipped": 1, "updated": 0, "inserted": 0, "total_rows": 1}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Bulk calendar upload: 0 inserted, 0 updated, 1 skipped	2026-06-10 11:48:10.276403+08
109	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 11:48:24.051005+08
110	2	\N	\N	INSERT	calendar_days	9	\N	{"date": "2026-08-01", "day_type": "INVALID_TYPE", "branch_id": null}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Calendar day created: 2026-08-01 (INVALID_TYPE)	2026-06-10 11:48:24.227738+08
111	2	\N	\N	INSERT	calendar_days	10	\N	{"day_type": "REGULAR_HOLIDAY", "branch_id": null}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Calendar day created: undefined (REGULAR_HOLIDAY)	2026-06-10 11:48:24.252025+08
112	2	\N	\N	DELETE	calendar_days	99999	\N	\N	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Calendar day deleted (id: 99999)	2026-06-10 11:48:24.271+08
113	2	2	\N	INSERT	users	5	\N	{"role": "EMPLOYEE", "username": "caltest", "employee_id": 2}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	User created: caltest	2026-06-10 11:48:24.384338+08
114	\N	2	\N	LOGIN_SUCCESS	users	5	\N	{"username": "caltest"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: caltest	2026-06-10 11:48:24.467555+08
115	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 11:49:32.155453+08
116	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 11:49:41.291554+08
117	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 11:49:51.16316+08
242	\N	\N	\N	ACCOUNT_LOCKED	users	5	\N	{"username": "caltest"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Locked account login attempt: caltest	2026-06-16 12:28:08.537083+08
118	2	\N	\N	INSERT	calendar_days	11	\N	{"date": "2026-08-01", "day_type": "REGULAR_HOLIDAY", "branch_id": null, "description": "Aug 1 valid"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Calendar day created: 2026-08-01 (REGULAR_HOLIDAY)	2026-06-10 11:49:51.225754+08
119	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 11:50:17.086816+08
120	2	\N	\N	DELETE	calendar_days	11	\N	\N	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Calendar day deleted (id: 11)	2026-06-10 11:50:17.212465+08
121	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Successful login: admin	2026-06-10 12:03:18.762485+08
122	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 12:08:28.741935+08
123	2	\N	\N	INSERT	attendance_rules	2	\N	{"is_active": false, "grace_period": 10, "late_threshold": 15, "max_work_hours": 9, "late_deduction_type": "FIXED", "late_deduction_value": "50.00", "late_deduction_enabled": true}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	New attendance rule created	2026-06-10 12:08:28.956726+08
124	2	\N	\N	UPDATE	attendance_rules	2	\N	{"is_active": true}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Attendance rule 2 set as active	2026-06-10 12:08:28.973898+08
125	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 12:08:39.979636+08
126	2	\N	\N	UPDATE	attendance_rules	2	{"is_active": true, "grace_period": 10, "late_threshold": 15, "max_work_hours": 9, "late_deduction_type": "FIXED", "late_deduction_value": 50, "late_deduction_enabled": true}	{"is_active": true, "grace_period": 15, "late_threshold": 30, "max_work_hours": 10, "late_deduction_type": "PER_MINUTE", "late_deduction_value": "5.50", "late_deduction_enabled": false}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Attendance rule 2 updated	2026-06-10 12:08:40.050217+08
127	2	\N	\N	UPDATE	system_settings	\N	\N	{"key": "enable_web_clock_in_out", "value": true}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	System setting toggled: enable_web_clock_in_out = true	2026-06-10 12:08:40.100973+08
128	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 12:09:28.364129+08
129	2	\N	\N	DELETE	attendance_rules	1	{"is_active": false, "grace_period": 0, "late_threshold": 0, "max_work_hours": 8}	\N	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Attendance rule 1 deleted	2026-06-10 12:09:28.567035+08
130	2	\N	\N	INSERT	attendance_rules	3	\N	{"is_active": false, "grace_period": -10, "late_threshold": -5, "max_work_hours": -1, "late_deduction_type": "FIXED", "late_deduction_value": "-100.00", "late_deduction_enabled": true}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	New attendance rule created	2026-06-10 12:09:28.7683+08
131	2	\N	\N	DELETE	attendance_rules	3	{"is_active": false, "grace_period": -10, "late_threshold": -5, "max_work_hours": -1}	\N	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Attendance rule 3 deleted	2026-06-10 12:09:28.780106+08
132	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 12:09:42.318984+08
133	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-10 12:10:37.506067+08
134	2	\N	\N	INSERT	attendance_rules	4	\N	{"is_active": false, "grace_period": 5, "late_threshold": 10, "max_work_hours": 8, "late_deduction_type": "FIXED", "late_deduction_value": "75.00", "late_deduction_enabled": true}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	New attendance rule created	2026-06-10 12:10:37.779384+08
135	2	\N	\N	DELETE	attendance_rules	4	{"is_active": false, "grace_period": 5, "late_threshold": 10, "max_work_hours": 8}	\N	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Attendance rule 4 deleted	2026-06-10 12:10:37.798838+08
136	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Successful login: admin	2026-06-10 13:10:35.94927+08
137	2	\N	\N	UPDATE	pay_rules	1	\N	{"day_type": "REGULAR", "multiplier": "1.01"}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Pay rule updated: REGULAR (1.01x)	2026-06-10 13:45:55.528588+08
138	2	\N	\N	UPDATE	pay_rules	1	\N	{"day_type": "REGULAR", "multiplier": "1.00"}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Pay rule updated: REGULAR (1.00x)	2026-06-10 13:46:03.275035+08
139	2	\N	\N	UPDATE	system_settings	\N	\N	{"key": "employee_code_separator", "value": ""}	192.168.2.59	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	System setting updated: employee_code_separator = 	2026-06-11 15:35:19.487456+08
140	2	\N	\N	UPDATE	system_settings	\N	\N	{"key": "employee_code_separator", "value": ""}	192.168.2.59	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	System setting updated: employee_code_separator = 	2026-06-11 15:35:19.536751+08
141	2	\N	\N	UPDATE	system_settings	\N	\N	{"key": "employee_code_prefix", "value": "EMP"}	192.168.2.59	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	System setting updated: employee_code_prefix = EMP	2026-06-11 15:35:19.543389+08
142	2	\N	\N	UPDATE	system_settings	\N	\N	{"key": "employee_code_counter", "value": "0"}	192.168.2.59	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	System setting updated: employee_code_counter = 0	2026-06-11 15:35:19.54703+08
143	2	\N	\N	UPDATE	system_settings	\N	\N	{"key": "employee_code_auto_generate", "value": "true"}	192.168.2.59	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	System setting updated: employee_code_auto_generate = true	2026-06-11 15:35:19.582424+08
144	2	\N	\N	UPDATE	system_settings	\N	\N	{"key": "employee_code_padding", "value": "3"}	192.168.2.59	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	System setting updated: employee_code_padding = 3	2026-06-11 15:35:19.590751+08
145	2	\N	\N	INSERT	rotation_groups	1	\N	{"code": "Prod-A", "name": "Production A", "description": null}	192.168.2.59	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Rotation group "Production A" created	2026-06-11 15:52:19.987115+08
146	2	\N	\N	INSERT	employee_rotation_group_assignments	\N	\N	\N	192.168.2.59	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	1 employee(s) assigned to rotation group 1 effective 2026-06-11	2026-06-11 15:52:37.369953+08
147	2	\N	\N	UPDATE	leave_types	\N	\N	{"settings": {"enforce_sil": true, "sil_min_days": 5, "conversion_rate": 1}, "leaveTypes": 0}	192.168.2.59	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Leave conversion settings and leave types saved all	2026-06-11 17:54:27.939584+08
148	2	9	\N	UPDATE	leave_credits	8	\N	{"sick_leave": "15.0", "vacation_leave": "15.0", "emergency_leave": 6, "maternity_leave": "60.0"}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Leave credits updated for employee 9	2026-06-12 09:29:26.209775+08
149	2	9	\N	UPDATE	leave_credits	8	\N	{"sick_leave": "15.0", "vacation_leave": "15.0", "emergency_leave": 5, "maternity_leave": "60.0"}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Leave credits updated for employee 9	2026-06-12 09:29:31.337429+08
150	2	\N	\N	UPDATE	company_settings	\N	\N	{"enforce_sil": false}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Leave conversion settings updated	2026-06-12 09:29:38.78459+08
151	2	\N	\N	UPDATE	company_settings	\N	\N	{"enforce_sil": true}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Leave conversion settings updated	2026-06-12 09:29:39.692283+08
152	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Successful login: admin	2026-06-12 09:37:31.921391+08
153	2	\N	\N	UPDATE	leave_types	1	\N	{"is_convertible": false, "max_convertible_days": null}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Leave type updated: Vacation Leave	2026-06-12 09:58:07.086789+08
154	2	\N	\N	UPDATE	leave_types	1	\N	{"is_convertible": true, "max_convertible_days": null}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Leave type updated: Vacation Leave	2026-06-12 09:58:08.021749+08
155	2	\N	\N	UPDATE	leave_types	2	\N	{"is_convertible": true, "max_convertible_days": null}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Leave type updated: Sick Leave	2026-06-12 09:58:10.75004+08
156	2	\N	\N	UPDATE	leave_types	2	\N	{"is_convertible": false, "max_convertible_days": null}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Leave type updated: Sick Leave	2026-06-12 09:58:12.113313+08
157	2	9	1	UPDATE	employees	9	{"status": "ARCHIVED", "position": "Tester", "branch_id": 1, "last_name": "Check", "department": "QA", "first_name": "Final", "employee_code": "FIXTEST2", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	{"status": "ARCHIVED", "position": "Tester", "branch_id": 1, "last_name": "Check", "department": "QA", "first_name": "Final", "employee_code": "FIXTEST2", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Employee updated: Final Check (FIXTEST2)	2026-06-12 14:55:28.0459+08
158	2	\N	\N	INSERT	recruitment_workflows	1	\N	{"name": "Standard", "is_active": true, "is_default": true}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Recruitment workflow created: Standard	2026-06-12 18:46:56.389023+08
159	2	\N	\N	INSERT	recruitment_workflow_stages	1	\N	{"stage_name": "Initial Interview", "stage_type": "INTERVIEW", "sequence_order": 1}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Stage "Initial Interview" created for workflow #1	2026-06-12 18:48:04.491393+08
160	2	\N	\N	INSERT	recruitment_workflow_stages	2	\N	{"stage_name": "Technical Test", "stage_type": "EXAM", "sequence_order": 2}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Stage "Technical Test" created for workflow #1	2026-06-12 18:49:05.448222+08
161	2	\N	\N	INSERT	recruitment_workflow_stages	3	\N	{"stage_name": "Final Interview", "stage_type": "INTERVIEW", "sequence_order": 3}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Stage "Final Interview" created for workflow #1	2026-06-12 18:50:04.340313+08
162	2	\N	\N	INSERT	recruitment_workflow_stages	4	\N	{"stage_name": "Passing Documents", "stage_type": "DOCUMENT_CHECK", "sequence_order": 4}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Stage "Passing Documents" created for workflow #1	2026-06-12 18:51:11.202012+08
163	2	\N	\N	INSERT	recruitment_workflow_stages	5	\N	{"stage_name": "Completed Applicant", "stage_type": "CONVERT_TO_EMPLOYEE", "sequence_order": 5}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Stage "Completed Applicant" created for workflow #1	2026-06-12 18:52:00.256525+08
164	2	\N	\N	INSERT	job_positions	1	\N	{"title": "Software Engineer", "status": "ACTIVE", "department": "Engineering"}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Job position created: Software Engineer	2026-06-12 18:52:36.047235+08
165	2	\N	\N	INSERT	applicants	1	\N	{"status": "Initial", "last_name": "Empuerto", "first_name": "Sam", "job_position_id": 1}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Applicant created: Sam Empuerto	2026-06-12 18:53:25.694454+08
166	2	\N	\N	INSERT	applicant_stage_records	1	\N	{"status": "SCHEDULED", "scheduled_at": "2026-06-12T10:54", "assigned_user_id": 2, "workflow_stage_id": "1"}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Stage record created/scheduled for applicant #1, workflow stage #1	2026-06-12 18:54:53.480403+08
167	2	\N	\N	UPDATE	applicant_stage_records	1	\N	{"score": 80, "status": "COMPLETED", "comments": "Passed on initial interview", "recommendation": "PASSED"}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Workflow stage #1 completed	2026-06-12 18:55:52.502709+08
168	2	\N	\N	INSERT	applicant_stage_records	2	\N	{"status": "SCHEDULED", "scheduled_at": "2026-06-12T11:05", "assigned_user_id": 2, "workflow_stage_id": "2"}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Stage record created/scheduled for applicant #1, workflow stage #2	2026-06-12 19:05:51.556569+08
169	2	\N	\N	UPDATE	applicant_stage_records	2	\N	{"score": 75, "status": "COMPLETED", "comments": "He passed on technical exam", "recommendation": "PASSED"}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Workflow stage #2 completed	2026-06-12 19:06:51.75077+08
170	2	\N	\N	UPDATE	applicant_workflow_instances	1	\N	{"current_stage_id": 3}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Applicant #1 moved to next workflow stage	2026-06-12 19:06:53.084658+08
171	2	\N	\N	INSERT	applicant_stage_records	3	\N	{"status": "SCHEDULED", "scheduled_at": "2026-06-12T11:10", "assigned_user_id": 2, "workflow_stage_id": "3"}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Stage record created/scheduled for applicant #1, workflow stage #3	2026-06-12 19:10:32.298104+08
172	2	\N	\N	UPDATE	applicant_stage_records	3	\N	{"status": "COMPLETED", "comments": null, "recommendation": "PASSED"}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Workflow stage #3 completed	2026-06-12 19:11:37.921626+08
173	2	\N	\N	UPDATE	applicant_workflow_instances	1	\N	{"current_stage_id": 4}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Applicant #1 moved to next workflow stage	2026-06-12 19:11:39.816958+08
174	2	\N	\N	INSERT	applicant_stage_records	4	\N	{"status": "SCHEDULED", "scheduled_at": "2026-06-12T11:12", "assigned_user_id": 2, "workflow_stage_id": "4"}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Stage record created/scheduled for applicant #1, workflow stage #4	2026-06-12 19:12:20.573769+08
175	2	\N	\N	INSERT	applicant_stage_records	5	\N	{"status": "SCHEDULED", "scheduled_at": "2026-06-12T11:12", "workflow_stage_id": "5"}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Stage record created/scheduled for applicant #1, workflow stage #5	2026-06-12 19:12:28.103278+08
176	2	\N	\N	UPDATE	applicant_stage_records	4	\N	{"status": "COMPLETED", "recommendation": "PASSED"}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Workflow stage #4 completed	2026-06-13 14:04:10.549473+08
177	2	\N	\N	UPDATE	applicant_workflow_instances	1	\N	{"current_stage_id": 5}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Applicant #1 moved to next workflow stage	2026-06-13 14:04:11.741645+08
178	\N	\N	\N	LOGIN_FAILED	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Failed login attempt: admin	2026-06-13 14:50:00.378731+08
179	2	\N	\N	UPDATE	applicant_stage_records	6	\N	{"status": "COMPLETED", "recommendation": "PASSED"}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Workflow stage #6 completed	2026-06-13 14:56:39.771076+08
180	2	\N	\N	UPDATE	applicant_workflow_instances	\N	\N	{}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Applicant #1 moved to next workflow stage	2026-06-13 14:56:41.841262+08
181	2	\N	\N	INSERT	applicants	2	\N	{"status": "Initial", "last_name": "Empuerto", "first_name": "hgh", "job_position_id": 1}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Applicant created: hgh Empuerto	2026-06-13 15:02:45.448096+08
182	2	\N	\N	INSERT	applicant_stage_records	7	\N	{"status": "SCHEDULED", "scheduled_at": "2026-06-13T07:02", "assigned_user_id": 2, "workflow_stage_id": "1"}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Stage record created/scheduled for applicant #2, workflow stage #1	2026-06-13 15:03:03.58284+08
183	2	\N	\N	UPDATE	applicant_stage_records	7	\N	{"score": 80, "status": "COMPLETED", "comments": null, "recommendation": "PASSED"}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Workflow stage #7 completed	2026-06-13 15:03:21.462861+08
184	2	\N	\N	UPDATE	applicant_workflow_instances	2	\N	{"current_stage_id": 2}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Applicant #2 moved to next workflow stage	2026-06-13 15:03:22.846642+08
185	2	\N	\N	INSERT	applicant_stage_records	8	\N	{"status": "SCHEDULED", "scheduled_at": "2026-06-13T07:03", "assigned_user_id": 2, "workflow_stage_id": "2"}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Stage record created/scheduled for applicant #2, workflow stage #2	2026-06-13 15:03:53.107342+08
186	2	\N	\N	UPDATE	applicant_stage_records	8	\N	{"score": 90, "status": "COMPLETED", "comments": null, "recommendation": "PASSED"}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Workflow stage #8 completed	2026-06-13 15:04:11.739172+08
187	2	\N	\N	UPDATE	applicant_workflow_instances	2	\N	{"current_stage_id": 3}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Applicant #2 moved to next workflow stage	2026-06-13 15:04:12.760179+08
188	2	\N	\N	INSERT	applicant_stage_records	9	\N	{"status": "SCHEDULED", "scheduled_at": "2026-06-13T07:05", "workflow_stage_id": "3"}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Stage record created/scheduled for applicant #2, workflow stage #3	2026-06-13 15:05:18.93183+08
189	2	\N	\N	UPDATE	applicant_stage_records	6	\N	{"comments": "Rescheduled for next week", "scheduled_at": "2026-06-20T10:00:00"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Workflow stage record #6 updated	2026-06-13 15:20:11.56449+08
243	\N	\N	\N	ACCOUNT_LOCKED	users	5	\N	{"username": "caltest"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Locked account login attempt: caltest	2026-06-16 12:28:09.055279+08
190	2	\N	\N	UPDATE	applicant_stage_records	3	\N	{"status": "SCHEDULED", "comments": "Assigned interviewer after scheduling", "scheduled_at": "2026-06-13T10:00:00", "assigned_user_id": 2}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Workflow stage record #3 updated	2026-06-13 15:32:49.341408+08
191	2	\N	\N	UPDATE	applicant_stage_records	9	\N	{"status": "SCHEDULED", "comments": null, "scheduled_at": "2026-06-13T07:05", "assigned_user_id": 2, "assigned_employee_id": 1}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Workflow stage record #9 updated	2026-06-13 15:35:36.131732+08
192	2	\N	\N	UPDATE	applicant_stage_records	9	\N	{"status": "COMPLETED", "comments": null, "recommendation": "PASSED"}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Workflow stage #9 completed	2026-06-13 15:36:05.004275+08
193	2	\N	\N	UPDATE	applicant_workflow_instances	2	\N	{"current_stage_id": 4}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Applicant #2 moved to next workflow stage	2026-06-13 15:36:06.379919+08
194	2	\N	\N	INSERT	applicant_stage_records	10	\N	{"status": "SCHEDULED", "scheduled_at": "2026-06-13T07:36", "assigned_user_id": 2, "workflow_stage_id": "4"}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Stage record created/scheduled for applicant #2, workflow stage #4	2026-06-13 15:36:34.225512+08
195	2	\N	\N	UPDATE	applicant_stage_records	10	\N	{"status": "COMPLETED", "comments": null, "recommendation": "PASSED"}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Workflow stage #10 completed	2026-06-13 15:36:40.929343+08
196	2	\N	\N	UPDATE	applicant_workflow_instances	2	\N	{"current_stage_id": 5}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Applicant #2 moved to next workflow stage	2026-06-13 15:36:41.988422+08
197	2	\N	\N	INSERT	applicant_stage_records	11	\N	{"status": "SCHEDULED", "scheduled_at": "2026-06-13T07:36", "assigned_user_id": 2, "workflow_stage_id": "5"}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Stage record created/scheduled for applicant #2, workflow stage #5	2026-06-13 15:36:56.76457+08
198	2	\N	\N	UPDATE	applicant_stage_records	11	\N	{"status": "COMPLETED", "comments": null, "recommendation": "PASSED"}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Workflow stage #11 completed	2026-06-13 15:37:03.159913+08
199	2	\N	\N	UPDATE	applicant_workflow_instances	\N	\N	{}	192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Applicant #2 moved to next workflow stage	2026-06-13 15:37:04.470655+08
200	2	\N	\N	INSERT	applicants	3	\N	{"status": "Initial", "last_name": "Empuerto", "first_name": "dada", "job_position_id": 1}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Applicant created: dada Empuerto	2026-06-16 08:10:01.688106+08
201	2	\N	\N	INSERT	applicant_stage_records	12	\N	{"status": "SCHEDULED", "scheduled_at": "2026-06-16T00:10", "assigned_user_id": 2, "workflow_stage_id": "1"}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Stage record created/scheduled for applicant #3, workflow stage #1	2026-06-16 08:10:25.395667+08
202	2	\N	\N	UPDATE	applicant_stage_records	12	\N	{"score": 10, "status": "COMPLETED", "comments": null, "recommendation": "PASSED"}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Workflow stage #12 completed	2026-06-16 08:10:52.017364+08
203	2	\N	\N	UPDATE	applicant_workflow_instances	3	\N	{"current_stage_id": 2}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Applicant #3 moved to next workflow stage	2026-06-16 08:10:54.319038+08
204	2	\N	\N	INSERT	applicant_stage_records	13	\N	{"status": "SCHEDULED", "scheduled_at": "2026-06-16T00:11", "assigned_user_id": 2, "workflow_stage_id": "2"}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Stage record created/scheduled for applicant #3, workflow stage #2	2026-06-16 08:11:11.405931+08
205	2	\N	\N	UPDATE	applicant_stage_records	13	\N	{"score": 70, "status": "COMPLETED", "comments": null, "recommendation": "PASSED"}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Workflow stage #13 completed	2026-06-16 08:11:49.096322+08
206	2	\N	\N	UPDATE	applicant_workflow_instances	3	\N	{"current_stage_id": 3}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Applicant #3 moved to next workflow stage	2026-06-16 08:11:51.141062+08
207	2	\N	\N	INSERT	applicant_stage_records	14	\N	{"status": "SCHEDULED", "scheduled_at": "2026-06-16T00:11", "assigned_user_id": 2, "workflow_stage_id": "3"}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Stage record created/scheduled for applicant #3, workflow stage #3	2026-06-16 08:12:01.770281+08
208	2	\N	\N	UPDATE	applicant_stage_records	14	\N	{"score": 100, "status": "COMPLETED", "comments": null, "recommendation": "PASSED"}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Workflow stage #14 completed	2026-06-16 08:12:12.933552+08
209	2	\N	\N	UPDATE	applicant_workflow_instances	3	\N	{"current_stage_id": 4}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Applicant #3 moved to next workflow stage	2026-06-16 08:12:14.500984+08
210	2	\N	\N	INSERT	applicant_stage_records	15	\N	{"status": "SCHEDULED", "scheduled_at": "2026-06-16T00:12", "assigned_user_id": 2, "workflow_stage_id": "4"}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Stage record created/scheduled for applicant #3, workflow stage #4	2026-06-16 08:12:27.881193+08
211	2	\N	\N	UPDATE	applicant_stage_records	15	\N	{"score": 100, "status": "COMPLETED", "comments": null, "recommendation": "PASSED"}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Workflow stage #15 completed	2026-06-16 08:12:45.255081+08
212	2	\N	\N	UPDATE	applicant_workflow_instances	3	\N	{"current_stage_id": 5}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Applicant #3 moved to next workflow stage	2026-06-16 08:12:46.931313+08
213	2	\N	\N	UPDATE	applicant_stage_records	16	\N	{"status": "COMPLETED", "recommendation": "PASSED"}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Workflow stage #16 completed	2026-06-16 08:13:10.110992+08
214	2	\N	\N	UPDATE	applicant_workflow_instances	\N	\N	{}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Applicant #3 moved to next workflow stage	2026-06-16 08:13:16.634478+08
215	2	\N	\N	UPDATE	applicants	3	\N	{"status": "Completed", "employee_id": 10}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Applicant #3 converted to employee #10	2026-06-16 08:34:06.391567+08
216	2	\N	\N	INSERT	employees	10	\N	{"status": "ACTIVE", "last_name": "Empuerto", "first_name": "dada", "employee_code": "EMP003"}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Employee created from applicant: dada Empuerto (EMP003)	2026-06-16 08:34:06.401231+08
217	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	192.168.0.110	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-16 09:51:38.323476+08
218	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	192.168.0.110	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-16 09:51:44.590906+08
219	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	192.168.0.110	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-16 09:58:04.414012+08
220	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	192.168.0.110	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-16 09:58:16.313928+08
221	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	192.168.0.110	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-16 09:58:25.851143+08
222	\N	\N	\N	LOGIN_FAILED	users	\N	\N	{"username": "employee"}	192.168.0.110	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Failed login attempt: employee	2026-06-16 09:58:34.844304+08
223	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	192.168.0.110	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-16 10:00:24.288618+08
224	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	192.168.0.110	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-16 10:00:34.426104+08
225	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	192.168.0.110	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-16 10:02:37.999408+08
226	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Successful login: admin	2026-06-16 10:27:07.69548+08
227	2	\N	\N	UPDATE	attendance_rules	2	{"is_active": true, "grace_period": 15, "late_threshold": 30, "max_work_hours": 10, "late_deduction_type": "PER_MINUTE", "late_deduction_value": 5.5, "late_deduction_enabled": false}	{"is_active": true, "grace_period": 15, "late_threshold": 30, "max_work_hours": 10, "late_deduction_type": "PER_MINUTE", "late_deduction_value": "5.50", "late_deduction_enabled": true}	192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	Attendance rule 2 updated	2026-06-16 11:58:38.616195+08
228	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-16 12:20:52.436866+08
229	2	\N	\N	CREATE	leave_types	6	\N	{"code": "CL", "name": "Compassionate Leave", "is_paid": true, "is_enabled": false, "sort_order": 10, "default_days": 5, "is_unlimited": false, "deducts_salary": false, "is_convertible": false, "affects_payroll": true, "requires_balance": true, "requires_approval": true, "include_in_credits": true, "employee_requestable": true}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Leave type 'CL' created	2026-06-16 12:21:13.028736+08
230	2	\N	\N	UPDATE	leave_types	6	\N	{"is_enabled": true}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Leave type 'CL' enabled	2026-06-16 12:21:27.305458+08
231	2	2	\N	UPDATE	employee_leave_balances	10	\N	{"balances": [{"code": "CL", "total_days": 10}]}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Leave credits updated for employee 2	2026-06-16 12:21:59.985483+08
232	\N	\N	\N	LOGIN_FAILED	users	\N	\N	{"username": "johnell"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Failed login attempt: johnell	2026-06-16 12:22:47.494632+08
233	\N	\N	\N	LOGIN_FAILED	users	5	\N	{"username": "caltest"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Failed login attempt: caltest	2026-06-16 12:22:59.814394+08
234	2	1	\N	UPDATE	employee_leave_balances	47	\N	{"balances": [{"code": "CL", "total_days": 10}]}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Leave credits updated for employee 1	2026-06-16 12:23:20.615059+08
235	2	1	\N	INSERT	leaves	1	\N	{"type": "CL", "reason": "Compassionate leave test", "status": "PENDING", "to_date": "2026-06-18", "from_date": "2026-06-17", "employee_id": 1, "day_fraction": 1, "half_day_type": null}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Leave request created: CL from 2026-06-17 to 2026-06-18	2026-06-16 12:23:26.926144+08
236	\N	\N	\N	LOGIN_FAILED	users	5	\N	{"username": "caltest"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Failed login attempt: caltest	2026-06-16 12:28:06.237125+08
237	\N	\N	\N	LOGIN_FAILED	users	5	\N	{"username": "caltest"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Failed login attempt: caltest	2026-06-16 12:28:06.830637+08
238	\N	\N	\N	LOGIN_FAILED	users	5	\N	{"username": "caltest"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Failed login attempt: caltest	2026-06-16 12:28:07.425044+08
239	\N	\N	\N	ACCOUNT_LOCKED	users	5	\N	{"username": "caltest"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Account locked after failed login: caltest	2026-06-16 12:28:07.51091+08
240	\N	\N	\N	LOGIN_FAILED	users	5	\N	{"username": "caltest"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Failed login attempt: caltest	2026-06-16 12:28:08.018257+08
241	\N	\N	\N	ACCOUNT_LOCKED	users	5	\N	{"username": "caltest"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Locked account login attempt: caltest	2026-06-16 12:28:08.026444+08
244	\N	\N	\N	ACCOUNT_LOCKED	users	5	\N	{"username": "caltest"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Locked account login attempt: caltest	2026-06-16 12:28:09.568807+08
245	\N	\N	\N	ACCOUNT_LOCKED	users	5	\N	{"username": "caltest"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Locked account login attempt: caltest	2026-06-16 12:28:10.083991+08
246	\N	\N	\N	ACCOUNT_LOCKED	users	5	\N	{"username": "caltest"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Locked account login attempt: caltest	2026-06-16 12:28:10.608243+08
247	\N	\N	\N	ACCOUNT_LOCKED	users	5	\N	{"username": "caltest"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Locked account login attempt: caltest	2026-06-16 12:28:11.119525+08
248	\N	\N	\N	ACCOUNT_LOCKED	users	5	\N	{"username": "caltest"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Locked account login attempt: caltest	2026-06-16 12:28:11.644169+08
249	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-16 12:28:42.46677+08
250	2	11	1	INSERT	employees	11	\N	{"status": "ACTIVE", "position": "Tester", "branch_id": 1, "last_name": "Tester", "department": "QA", "first_name": "Flow", "employee_code": "FLO001", "employment_status": "REGULAR", "regularization_date": null, "probation_period_months": null}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Employee created: Flow Tester (FLO001) - REGULAR	2026-06-16 12:28:51.893189+08
251	\N	11	\N	LOGIN_SUCCESS	users	7	\N	{"username": "flowtester"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: flowtester	2026-06-16 12:29:42.247714+08
252	2	11	\N	UPDATE	employee_leave_balances	48	\N	{"balances": [{"code": "CL", "total_days": 10}]}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Leave credits updated for employee 11	2026-06-16 12:30:00.017014+08
253	7	11	\N	INSERT	leaves	2	\N	{"type": "CL", "reason": "Testing approval flow for CL", "status": "PENDING", "to_date": "2026-06-18", "from_date": "2026-06-17", "employee_id": 11, "day_fraction": 1, "half_day_type": null}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Leave request created: CL from 2026-06-17 to 2026-06-18	2026-06-16 12:30:25.544966+08
254	2	11	\N	APPROVE	leaves	2	{"status": "PENDING"}	{"status": "APPROVED", "rejection_reason": null}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Leave 2 approved	2026-06-16 12:30:37.896916+08
255	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-16 13:47:40.655343+08
256	\N	1	\N	LOGIN_SUCCESS	users	2	\N	{"username": "admin"}	127.0.0.1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	Successful login: admin	2026-06-16 14:17:56.338784+08
\.


--
-- Data for Name: branch_rest_days; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.branch_rest_days (id, branch_id, day_of_week, is_active, created_at, updated_at) FROM stdin;
1	1	6	t	2026-06-10 10:42:20.521692	2026-06-10 10:42:20.521692
2	1	0	t	2026-06-10 10:42:31.24776	2026-06-10 10:42:31.24776
\.


--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.branches (id, code, name, is_active, created_at, address, city, province, phone, updated_at, timezone) FROM stdin;
1	MAINBRANCH-001	Cebu Branch	t	2026-06-10 09:50:14.605276	Purok Gumamela, Tal-ot	BARILI	CEBU	09690622194	2026-06-10 09:50:14.605276	Asia/Manila
2	TEST-BRN-001-UPDATED	Updated Branch	f	2026-06-10 11:05:32.031605	456 New St	New City	New Province	9876543210	2026-06-10 11:07:24.280715	Asia/Singapore
\.


--
-- Data for Name: calendar_days; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.calendar_days (id, date, day_type, is_paid, description, branch_id) FROM stdin;
1	2026-06-12	REGULAR_HOLIDAY	t	Independence Day (Updated)	\N
5	2026-06-12	SPECIAL_NON_WORKING	f	Branch-specific June 12	1
6	2026-06-26	REGULAR	t	Branch regular day	1
8	2026-07-27	SPECIAL_NON_WORKING	t	Local holiday (Bulk)	1
7	2026-07-04	SPECIAL_HOLIDAY	f	Overwritten	\N
\.


--
-- Data for Name: company_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.company_settings (id, name, address, tin, sss, philhealth, hdmf, logo, created_at, enforce_sil, sil_min_days, conversion_rate) FROM stdin;
1	\N	\N	\N	\N	\N	\N	\N	2026-06-12 09:53:42.467611	t	5	1.0
\.


--
-- Data for Name: conversion_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.conversion_logs (id, year, processed_at, total_processed, total_converted, total_amount, status, details, error_message, created_at) FROM stdin;
\.


--
-- Data for Name: device_log_mappings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.device_log_mappings (id, device_id, field_source, field_target, transform_expression, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: devices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.devices (id, name, ip_address, location, created_at, type, status, updated_at, serial_number, model, port, api_key, last_connected_at, notes, branch_id, api_key_hash, api_key_created_at, api_key_last_used_at) FROM stdin;
\.


--
-- Data for Name: email_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.email_logs (id, employee_id, payroll_id, type, status, error, sent_at, attempted_at, created_at) FROM stdin;
\.


--
-- Data for Name: email_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.email_templates (id, type, subject, body_html, body_text, is_active, created_by, updated_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: employee_approvers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_approvers (id, employee_id, approver_id, approval_type, created_at) FROM stdin;
\.


--
-- Data for Name: employee_deductions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_deductions (id, employee_id, type, amount, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: employee_device_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_device_users (id, employee_id, device_id, device_user_id, active, created_at) FROM stdin;
\.


--
-- Data for Name: employee_education; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_education (id, employee_id, education_level, school_name, course_or_degree, year_started, year_graduated, honors_awards, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: employee_family_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_family_members (id, employee_id, relationship_type, full_name, birthdate, occupation, contact_number, address, is_dependent, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: employee_kpi_evaluations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_kpi_evaluations (id, employee_id, evaluator_id, template_id, evaluation_period_start, evaluation_period_end, status, self_evaluation, manager_comments, final_score, recommendation, hr_approved, hr_approval_date, hr_comments, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: employee_kpi_scores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_kpi_scores (id, evaluation_id, template_item_id, manager_score, weighted_score, remarks, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: employee_leave_balances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_leave_balances (id, employee_id, leave_type_id, year, total_days, used_days, carried_over_days, adjusted_days, created_at, updated_at) FROM stdin;
1	2	2	2026	15.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
2	3	2	2026	15.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
3	4	2	2026	15.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
4	5	2	2026	15.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
5	6	2	2026	15.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
6	7	2	2026	15.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
7	8	2	2026	15.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
8	9	2	2026	15.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
9	10	2	2026	15.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
10	2	1	2026	15.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
11	3	1	2026	15.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
12	4	1	2026	15.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
13	5	1	2026	15.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
14	6	1	2026	15.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
15	7	1	2026	15.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
16	8	1	2026	15.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
17	9	1	2026	15.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
18	10	1	2026	15.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
19	2	4	2026	60.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
20	3	4	2026	60.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
21	4	4	2026	60.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
22	5	4	2026	60.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
23	6	4	2026	60.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
24	7	4	2026	60.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
25	8	4	2026	60.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
26	9	4	2026	60.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
27	10	4	2026	60.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
28	2	3	2026	5.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
29	3	3	2026	5.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
30	4	3	2026	5.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
31	5	3	2026	5.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
32	6	3	2026	5.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
33	7	3	2026	5.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
34	8	3	2026	5.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
35	9	3	2026	5.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
36	10	3	2026	5.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
37	2	5	2026	0.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
38	3	5	2026	0.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
39	4	5	2026	0.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
40	5	5	2026	0.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
41	6	5	2026	0.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
42	7	5	2026	0.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
43	8	5	2026	0.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
44	9	5	2026	0.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
45	10	5	2026	0.0	0.0	0.0	0.0	2026-06-16 11:18:19.7165	2026-06-16 11:18:19.7165
46	2	6	2026	10.0	0.0	0.0	0.0	2026-06-16 12:21:59.957935	2026-06-16 12:21:59.957935
47	1	6	2026	10.0	2.0	0.0	0.0	2026-06-16 12:23:20.605189	2026-06-16 12:24:44.838907
48	11	1	2026	5.0	0.0	0.0	0.0	2026-06-16 12:28:51.87243	2026-06-16 12:28:51.87243
49	11	2	2026	15.0	0.0	0.0	0.0	2026-06-16 12:28:51.87243	2026-06-16 12:28:51.87243
50	11	3	2026	5.0	0.0	0.0	0.0	2026-06-16 12:28:51.87243	2026-06-16 12:28:51.87243
51	11	4	2026	60.0	0.0	0.0	0.0	2026-06-16 12:28:51.87243	2026-06-16 12:28:51.87243
52	11	5	2026	0.0	0.0	0.0	0.0	2026-06-16 12:28:51.87243	2026-06-16 12:28:51.87243
53	11	6	2026	10.0	2.0	0.0	0.0	2026-06-16 12:28:51.87243	2026-06-16 12:30:37.8388
\.


--
-- Data for Name: employee_onboarding; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_onboarding (id, employee_id, applicant_id, onboarding_date, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: employee_requirements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_requirements (id, onboarding_id, requirement_name, description, status, submitted_at, verified_at, file_url, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: employee_rest_days; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_rest_days (id, employee_id, day_of_week, effective_date, end_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: employee_rotation_group_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_rotation_group_assignments (id, employee_id, rotation_group_id, effective_date, end_date, created_at, updated_at) FROM stdin;
1	2	1	2026-06-11	\N	2026-06-11 15:52:37.360844	2026-06-11 15:52:37.360844
\.


--
-- Data for Name: employee_salary; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_salary (id, employee_id, basic_salary, daily_rate, overtime_rate, created_at, updated_at, working_days_per_month) FROM stdin;
2	3	0.00	\N	1.25	2026-06-10 10:23:36.756514	\N	26
3	4	0.00	\N	1.25	2026-06-10 11:14:22.880727	\N	26
4	5	0.00	\N	1.25	2026-06-10 11:14:43.978774	\N	26
5	6	0.00	\N	1.25	2026-06-10 11:22:18.624821	\N	26
6	7	0.00	\N	1.25	2026-06-10 11:22:36.934255	\N	26
7	8	0.00	\N	1.25	2026-06-10 11:34:08.280972	\N	26
8	9	0.00	\N	1.25	2026-06-10 11:34:46.077566	\N	26
9	10	0.00	\N	1.25	2026-06-16 08:34:05.816075	\N	26
10	11	0.00	\N	1.25	2026-06-16 12:28:51.87243	\N	26
1	2	0.00	\N	1.25	2026-06-10 09:45:35.931056	\N	26
\.


--
-- Data for Name: employee_shift_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_shift_assignments (id, employee_id, shift_id, effective_date, end_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: employee_work_experience; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_work_experience (id, employee_id, company_name, "position", start_date, end_date, reason_for_leaving, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employees (id, employee_code, rfid_tag, fingerprint_id, department, status, created_at, birthday, gender, contact_number, address, "position", profile_image, hired_date, marital_status, sss_number, philhealth_number, hdmf_number, tin_number, first_name, middle_name, last_name, suffix, emergency_contact_name, emergency_contact_number, emergency_contact_address, emergency_contact_relation, email, resignation_date, termination_date, final_pay_processed, final_pay_date, final_pay_amount, last_working_date, branch_id, employment_status, termination_reason, probation_period_months, regularization_date) FROM stdin;
1	ADMIN001	\N	\N	Administration	ACTIVE	2026-06-10 09:29:49.088879	\N	\N	\N	\N	System Administrator	\N	2026-06-10	\N	\N	\N	\N	\N	System	\N	Administrator	\N	\N	\N	\N	\N	admin@example.com	\N	\N	f	\N	\N	\N	\N	REGULAR	\N	\N	\N
3	EMP002	\N	\N	Production	ACTIVE	2026-06-10 10:23:36.756514	\N	\N	+639690622194	purok gumamela	Software Engineer	\N	2026-06-10	\N	\N	\N	\N	\N	Johnellssss	sd	Empuerto	Sr.	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	1	REGULAR	\N	\N	\N
2	EMP001	\N	\N	Engineering	ACTIVE	2026-06-10 09:45:35.931056	1999-01-12	Male	+639690622194	purok gumamela	Software Engineer	\N	2026-06-10	Single	34-8149058-4	60-379602468-5	2610-34395936-1	275-447-424-9834	Johnell	Enot	Empuerto	Sr.	Juan Empuerto	09690622194	purok gumamela	Father	\N	\N	\N	f	\N	\N	\N	1	REGULAR	\N	\N	\N
4	TEST001	\N	\N	\N	ARCHIVED	2026-06-10 11:14:22.880727	\N	\N	\N	\N	Senior Tester	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	1	\N	\N	\N	\N
7	TEST004	\N	\N	QA	ARCHIVED	2026-06-10 11:22:36.934255	\N	\N	\N	\N	Tester	\N	\N	\N	\N	\N	\N	\N	NullBranch	\N	Fixed	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	1	REGULAR	\N	\N	\N
8	FIXTEST1	\N	\N	QA	ARCHIVED	2026-06-10 11:34:08.280972	\N	\N	\N	\N	Tester	\N	\N	\N	\N	\N	\N	\N	NullBranch	\N	Create	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	1	REGULAR	\N	\N	\N
6	TEST003	\N	\N	QA	ARCHIVED	2026-06-10 11:22:18.624821	\N	\N	\N	\N	Tester	\N	\N	\N	\N	\N	\N	\N	NullBranch	\N	Test	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	1	REGULAR	\N	\N	\N
5	TEST002	\N	\N	\N	ARCHIVED	2026-06-10 11:14:43.978774	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	1	\N	\N	\N	\N
9	FIXTEST2	\N	\N	QA	ARCHIVED	2026-06-10 11:34:46.077566	\N	\N	\N	\N	Tester	\N	\N	\N	\N	\N	\N	\N	Final	\N	Check	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	1	REGULAR	\N	\N	\N
10	EMP003	\N	\N	Engineering	ACTIVE	2026-06-16 08:34:05.816075	\N	\N	09690622194	purok gumamela	Software Engineer	\N	2026-06-16	\N	\N	\N	\N	\N	dada	Enot	Empuerto	\N	\N	\N	\N	\N	empuertojohnellchess@gmail.com	\N	\N	f	\N	\N	\N	1	PROBATIONARY	\N	6	2026-12-16
11	FLO001	\N	\N	QA	ACTIVE	2026-06-16 12:28:51.87243	\N	\N	\N	\N	Tester	\N	\N	\N	\N	\N	\N	\N	Flow	\N	Tester	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	1	REGULAR	\N	\N	\N
\.


--
-- Data for Name: final_pay; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.final_pay (id, employee_id, resignation_date, termination_date, last_working_date, days_worked, salary_until_last_day, leave_conversion_amount, total_amount, processed_by, processed_at, status, created_at) FROM stdin;
\.


--
-- Data for Name: forecast_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.forecast_logs (id, metric_name, branch_id, department, predicted_value, actual_value, confidence, forecast_date, period_type, method, metadata, generated_at, created_at) FROM stdin;
\.


--
-- Data for Name: hr_form_answers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hr_form_answers (id, assignment_id, field_id, answer, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: hr_form_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hr_form_assignments (id, form_id, employee_id, assigned_by, due_date, status, submitted_at, created_at) FROM stdin;
\.


--
-- Data for Name: hr_form_fields; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hr_form_fields (id, form_id, label, field_type, field_order, required, options, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: hr_form_submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hr_form_submissions (id, assignment_id, employee_id, form_id, answer_sheet_data, answer_sheet_config, status, submitted_at, reviewed_at, reviewed_by, remarks) FROM stdin;
\.


--
-- Data for Name: hr_forms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hr_forms (id, title, description, sheet_data, sheet_config, is_active, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: hr_policy_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hr_policy_documents (id, title, category, content, is_active, created_by, updated_by, created_at, updated_at, content_format) FROM stdin;
\.


--
-- Data for Name: job_positions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_positions (id, title, department, description, requirements, salary_range, status, created_at, updated_at, employment_type, branch_id, workflow_id) FROM stdin;
1	Software Engineer	Engineering	\N	\N	50k	ACTIVE	2026-06-12 18:52:36.029158	2026-06-12 18:52:36.029158	Full-time	1	1
\.


--
-- Data for Name: kpi_template_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.kpi_template_items (id, template_id, kpi_name, description, weight, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: kpi_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.kpi_templates (id, name, description, department, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: leave_conversions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leave_conversions (id, employee_id, year, leave_type, days_converted, daily_rate, conversion_rate, amount, processed_by, created_at, remarks, updated_at) FROM stdin;
\.


--
-- Data for Name: leave_credits_backup_before_drop; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leave_credits_backup_before_drop (id, employee_id, sick_leave, vacation_leave, used_sick_leave, used_vacation_leave, created_at, maternity_leave, used_maternity_leave, emergency_leave, used_emergency_leave, no_pay_leave, used_no_pay_leave, last_conversion_year) FROM stdin;
1	2	15.0	15.0	0.0	0.0	2026-06-10 09:45:35.931056	60.0	0.0	5.0	0.0	0.0	0.0	\N
2	3	15.0	15.0	0.0	0.0	2026-06-10 10:23:36.756514	60.0	0.0	5.0	0.0	0.0	0.0	\N
3	4	15.0	15.0	0.0	0.0	2026-06-10 11:14:22.880727	60.0	0.0	5.0	0.0	0.0	0.0	\N
4	5	15.0	15.0	0.0	0.0	2026-06-10 11:14:43.978774	60.0	0.0	5.0	0.0	0.0	0.0	\N
5	6	15.0	15.0	0.0	0.0	2026-06-10 11:22:18.624821	60.0	0.0	5.0	0.0	0.0	0.0	\N
6	7	15.0	15.0	0.0	0.0	2026-06-10 11:22:36.934255	60.0	0.0	5.0	0.0	0.0	0.0	\N
7	8	15.0	15.0	0.0	0.0	2026-06-10 11:34:08.280972	60.0	0.0	5.0	0.0	0.0	0.0	\N
8	9	15.0	15.0	0.0	0.0	2026-06-10 11:34:46.077566	60.0	0.0	5.0	0.0	0.0	0.0	\N
9	10	15.0	15.0	0.0	0.0	2026-06-16 08:34:05.816075	60.0	0.0	5.0	0.0	0.0	0.0	\N
\.


--
-- Data for Name: leave_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leave_types (id, code, name, is_paid, is_convertible, max_convertible_days, requires_balance, created_at, default_days, is_enabled, requires_attachment, requires_approval, employee_requestable, hr_only, include_in_credits, is_unlimited, affects_payroll, deducts_salary, sort_order, updated_at, description) FROM stdin;
1	VL	Vacation Leave	t	t	5	t	2026-06-12 09:53:42.467611	5	t	f	t	t	f	t	f	t	f	1	2026-06-16 11:18:19.7165	Annual vacation leave entitlement
2	SL	Sick Leave	t	f	\N	t	2026-06-12 09:53:42.467611	15	t	f	t	t	f	t	f	t	f	2	2026-06-16 11:18:19.7165	Sick leave for medical needs
3	EL	Emergency Leave	t	f	\N	t	2026-06-12 09:53:42.467611	5	t	f	t	t	f	t	f	t	f	3	2026-06-16 11:18:19.7165	Emergency leave for urgent personal matters
4	ML	Maternity Leave	t	f	\N	t	2026-06-12 09:53:42.467611	60	t	f	t	t	f	t	f	t	f	4	2026-06-16 11:18:19.7165	Maternity leave for childbirth and recovery
5	NP	No Pay Leave	f	f	\N	f	2026-06-12 09:53:42.467611	0	t	f	t	t	f	t	t	t	t	5	2026-06-16 11:18:19.7165	Unpaid leave without salary
6	CL	Compassionate Leave	t	f	\N	t	2026-06-16 12:21:13.02009	5	t	f	t	t	f	t	f	t	f	10	2026-06-16 12:21:27.292716	\N
\.


--
-- Data for Name: leaves; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leaves (id, employee_id, type, from_date, to_date, reason, status, created_at, day_fraction, half_day_type, rejection_reason) FROM stdin;
1	1	CL	2026-06-17	2026-06-18	Compassionate leave test	APPROVED	2026-06-16 12:23:26.878219	1	\N	\N
2	11	CL	2026-06-17	2026-06-18	Testing approval flow for CL	APPROVED	2026-06-16 12:30:25.50286	1	\N	\N
\.


--
-- Data for Name: man_hour_report_details; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.man_hour_report_details (id, report_id, time_from, time_to, activity, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: man_hour_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.man_hour_reports (id, employee_id, work_date, task, hours, remarks, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notification_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification_rules (id, rule_key, module, name, description, is_enabled, in_app_enabled, email_enabled, threshold_count, threshold_days, threshold_hours, threshold_percent, frequency, target_roles, template_key, is_system, created_at, updated_at) FROM stdin;
5	leave_rejected	leave	Leave Rejected Notification	Notify when leave request is rejected	t	t	t	\N	\N	\N	\N	immediate	\N	LEAVE_REJECTED	t	2026-06-16 14:17:25.038211	2026-06-16 14:17:25.038211
11	anomaly_late	attendance	Repeated Late Anomaly	Detect employees with repeated late attendance	t	t	f	3	7	\N	\N	immediate	\N	\N	t	2026-06-16 14:17:25.038211	2026-06-16 14:17:25.038211
12	anomaly_missing_checkout	attendance	Missing Checkout Anomaly	Detect employees missing checkout repeatedly	t	t	f	3	7	\N	\N	immediate	\N	\N	t	2026-06-16 14:17:25.038211	2026-06-16 14:17:25.038211
13	anomaly_undertime	attendance	Undertime Anomaly	Detect employees with frequent undertime	t	t	f	3	7	\N	\N	immediate	\N	\N	t	2026-06-16 14:17:25.038211	2026-06-16 14:17:25.038211
16	anomaly_rejected_ot	overtime	Repeated Rejected Overtime	Detect employees with repeatedly rejected overtime	t	t	f	3	30	\N	\N	immediate	\N	\N	t	2026-06-16 14:17:25.038211	2026-06-16 14:17:25.038211
17	anomaly_salary_change	payroll	Salary Change Anomaly	Detect significant net salary changes	t	t	f	\N	\N	\N	0.3000	immediate	\N	\N	t	2026-06-16 14:17:25.038211	2026-06-16 14:17:25.038211
18	anomaly_deduction_change	payroll	Deduction Change Anomaly	Detect significant deduction changes	t	t	f	\N	\N	\N	0.5000	immediate	\N	\N	t	2026-06-16 14:17:25.038211	2026-06-16 14:17:25.038211
19	anomaly_frequent_leave	leave	Frequent Leave Anomaly	Detect employees taking leave too frequently	t	t	f	3	30	\N	\N	immediate	\N	\N	t	2026-06-16 14:17:25.038211	2026-06-16 14:17:25.038211
20	anomaly_leave_around_absence	leave	Leave Around Absence Anomaly	Detect leave patterns around absences	t	t	f	2	3	\N	\N	immediate	\N	\N	t	2026-06-16 14:17:25.038211	2026-06-16 14:17:25.038211
21	anomaly_time_mod	attendance	Time Modification Anomaly	Detect excessive time modification edits	t	t	f	3	30	\N	\N	immediate	\N	\N	t	2026-06-16 14:17:25.038211	2026-06-16 14:17:25.038211
22	anomaly_rejected_time_mod	attendance	Rejected Time Modification Anomaly	Detect repeatedly rejected time modifications	t	t	f	3	30	\N	\N	immediate	\N	\N	t	2026-06-16 14:17:25.038211	2026-06-16 14:17:25.038211
23	anomaly_man_hour_excessive	man_hours	Excessive Man Hours Anomaly	Detect excessive man hour reports	t	t	f	\N	\N	12.00	\N	immediate	\N	\N	t	2026-06-16 14:17:25.038211	2026-06-16 14:17:25.038211
24	anomaly_man_hour_edits	man_hours	Repeated Man Hour Edits Anomaly	Detect repeated man hour report edits	t	t	f	3	7	\N	\N	immediate	\N	\N	t	2026-06-16 14:17:25.038211	2026-06-16 14:17:25.038211
14	anomaly_excessive_daily_ot	attendance	Excessive Daily Overtime	Detect excessive daily overtime hours	t	t	f	\N	\N	4.00	\N	immediate	\N	\N	t	2026-06-16 14:17:25.038211	2026-06-16 14:17:25.038211
15	anomaly_excessive_weekly_ot	attendance	Excessive Weekly Overtime	Detect excessive weekly overtime hours	t	t	f	\N	\N	12.00	\N	immediate	\N	\N	t	2026-06-16 14:17:25.038211	2026-06-16 14:17:25.038211
1	login_otp	system	Login OTP Email	Send OTP code via email during login	t	f	f	\N	\N	\N	\N	immediate	\N	\N	t	2026-06-16 14:17:25.038211	2026-06-16 14:41:36.124051
3	absent_no_leave	attendance	Absent Without Leave Notice	Send email if employee is absent without approved leave	t	t	f	\N	\N	\N	\N	immediate	\N	ABSENT_WITHOUT_LEAVE	t	2026-06-16 14:17:25.038211	2026-06-16 14:41:43.372183
6	overtime_approved	overtime	Overtime Approved Notification	Notify when overtime request is approved	t	t	f	\N	\N	\N	\N	immediate	\N	OVERTIME_APPROVED	t	2026-06-16 14:17:25.038211	2026-06-16 14:42:17.18819
7	overtime_rejected	overtime	Overtime Rejected Notification	Notify when overtime request is rejected	t	t	f	\N	\N	\N	\N	immediate	\N	OVERTIME_REJECTED	t	2026-06-16 14:17:25.038211	2026-06-16 14:42:17.997969
10	payroll_marked_paid	payroll	Payroll Marked Paid Notification	Notify employee when payroll is marked as paid	t	t	f	\N	\N	\N	\N	immediate	\N	PAYROLL_MARKED_PAID	t	2026-06-16 14:17:25.038211	2026-06-16 14:42:20.741889
9	man_hour_rejected	man_hours	Man Hour Rejected Notification	Notify when man hour report is rejected	t	t	f	\N	\N	\N	\N	immediate	\N	MAN_HOUR_REJECTED	t	2026-06-16 14:17:25.038211	2026-06-16 14:42:25.756935
8	man_hour_approved	man_hours	Man Hour Approved Notification	Notify when man hour report is approved	t	t	f	\N	\N	\N	\N	immediate	\N	MAN_HOUR_APPROVED	t	2026-06-16 14:17:25.038211	2026-06-16 14:42:26.362833
4	leave_approved	leave	Leave Approved Notification	Notify when leave request is approved	t	t	f	\N	\N	\N	\N	immediate	\N	LEAVE_APPROVED	t	2026-06-16 14:17:25.038211	2026-06-16 14:42:29.705998
2	late_notice	attendance	Late Notice Email	Send email when employee is late multiple times	t	t	f	3	7	\N	\N	immediate	\N	LATE_NOTICE	t	2026-06-16 14:17:25.038211	2026-06-16 14:42:32.157213
25	stat_anomaly_moving_average	attendance	Moving Average Window	Minimum data points / window size for attendance trend calculations	t	t	f	\N	7	\N	\N	daily	\N	\N	t	2026-06-16 15:16:03.872151	2026-06-16 15:16:03.872151
26	stat_anomaly_attendance_rate	attendance	Attendance Rate Period	Analysis period in days for daily attendance rate monitoring	t	t	f	\N	30	\N	\N	daily	\N	\N	t	2026-06-16 15:16:03.872151	2026-06-16 15:16:03.872151
27	stat_anomaly_absenteeism_spike	attendance	Absenteeism Spike Detection	Detect sudden increase in absences. threshold_days = recent window, threshold_count = spike difference threshold	t	t	f	2	7	\N	\N	daily	\N	\N	t	2026-06-16 15:16:03.872151	2026-06-16 15:16:03.872151
28	stat_anomaly_overtime_history	overtime	Overtime History Period	Historical period in days for weekly overtime statistical analysis	t	t	f	\N	60	\N	\N	daily	\N	\N	t	2026-06-16 15:16:03.872151	2026-06-16 15:16:03.872151
29	stat_anomaly_leave_frequency	leave	Leave Frequency Period	Leave frequency comparison. threshold_days = recent period, threshold_count = historical period	t	t	f	90	30	\N	\N	daily	\N	\N	t	2026-06-16 15:16:03.872151	2026-06-16 15:16:03.872151
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, type, title, message, reference_id, meta, is_read, created_at) FROM stdin;
1	2	EMPLOYEE	New Employee Created	Johnell Empuerto (EMP001) has been added to the system.	2	{"employee_id": 2}	f	2026-06-10 09:45:35.983972
2	2	EMPLOYEE	New Employee Created	Johnellssss Empuerto (EMP002) has been added to the system.	3	{"employee_id": 3}	f	2026-06-10 10:23:36.86888
3	2	EMPLOYEE	New Employee Created	Test User (TEST001) has been added to the system.	4	{"employee_id": 4}	f	2026-06-10 11:14:22.892272
4	2	EMPLOYEE	New Employee Created	NoBranch User (TEST002) has been added to the system.	5	{"employee_id": 5}	f	2026-06-10 11:14:43.990896
5	2	EMPLOYEE	New Employee Created	NullBranch Test (TEST003) has been added to the system.	6	{"employee_id": 6}	f	2026-06-10 11:22:18.637025
6	2	EMPLOYEE	New Employee Created	NullBranch Fixed (TEST004) has been added to the system.	7	{"employee_id": 7}	f	2026-06-10 11:22:36.944627
7	2	EMPLOYEE	New Employee Created	NullBranch Create (FIXTEST1) has been added to the system.	8	{"employee_id": 8}	f	2026-06-10 11:34:08.290528
8	2	EMPLOYEE	New Employee Created	Final Check (FIXTEST2) has been added to the system.	9	{"employee_id": 9}	f	2026-06-10 11:34:46.088197
9	2	RECRUITMENT	New Applicant Registration	Sam Empuerto registered as applicant	1	\N	f	2026-06-12 18:53:25.596581
10	2	RECRUITMENT	Stage Completed	Initial Interview completed for Sam Empuerto	1	\N	f	2026-06-12 18:55:52.554634
11	2	RECRUITMENT	Stage Completed	Technical Test completed for Sam Empuerto	1	\N	f	2026-06-12 19:06:51.801609
12	2	RECRUITMENT	Stage Completed	Final Interview completed for Sam Empuerto	1	\N	f	2026-06-12 19:11:37.977287
13	2	RECRUITMENT	Stage Completed	Passing Documents completed for Sam Empuerto	1	\N	f	2026-06-13 14:04:10.592677
14	2	RECRUITMENT	Stage Completed	Completed Applicant completed for Sam Empuerto	1	\N	f	2026-06-13 14:56:39.858552
15	2	RECRUITMENT	New Applicant Registration	hgh Empuerto registered as applicant	2	\N	f	2026-06-13 15:02:45.335944
16	2	RECRUITMENT	Stage Completed	Initial Interview completed for hgh Empuerto	2	\N	f	2026-06-13 15:03:21.573742
17	2	RECRUITMENT	Stage Completed	Technical Test completed for hgh Empuerto	2	\N	f	2026-06-13 15:04:11.746692
18	2	RECRUITMENT	Stage Completed	Final Interview completed for hgh Empuerto	2	\N	f	2026-06-13 15:36:05.058937
19	2	RECRUITMENT	Stage Completed	Passing Documents completed for hgh Empuerto	2	\N	f	2026-06-13 15:36:40.930008
20	2	RECRUITMENT	Stage Completed	Completed Applicant completed for hgh Empuerto	2	\N	f	2026-06-13 15:37:03.160582
21	2	RECRUITMENT	New Applicant Registration	dada Empuerto registered as applicant	3	\N	f	2026-06-16 08:10:01.622322
22	2	RECRUITMENT	Stage Completed	Initial Interview completed for dada Empuerto	3	\N	f	2026-06-16 08:10:52.211043
27	2	RECRUITMENT	Applicant Hired	dada Empuerto has been hired as EMP003	3	\N	f	2026-06-16 08:34:06.212134
26	2	RECRUITMENT	Stage Completed	Completed Applicant completed for dada Empuerto	3	\N	t	2026-06-16 08:13:10.344395
25	2	RECRUITMENT	Stage Completed	Passing Documents completed for dada Empuerto	3	\N	t	2026-06-16 08:12:45.449288
24	2	RECRUITMENT	Stage Completed	Final Interview completed for dada Empuerto	3	\N	t	2026-06-16 08:12:12.94797
23	2	RECRUITMENT	Stage Completed	Technical Test completed for dada Empuerto	3	\N	t	2026-06-16 08:11:49.467418
28	2	LEAVE	New Leave Request	System Administrator requested CL leave	1	{"status": "PENDING", "to_date": "2026-06-18", "leave_id": 1, "from_date": "2026-06-17", "leave_type": "CL", "day_fraction": 1, "employee_name": "System Administrator", "half_day_type": null}	f	2026-06-16 12:23:26.925842
29	2	EMPLOYEE	New Employee Created	Flow Tester (FLO001) has been added to the system.	11	{"employee_id": 11}	f	2026-06-16 12:28:51.893741
30	2	LEAVE	New Leave Request	Flow Tester requested CL leave	2	{"status": "PENDING", "to_date": "2026-06-18", "leave_id": 2, "from_date": "2026-06-17", "leave_type": "CL", "day_fraction": 1, "employee_name": "Flow Tester", "half_day_type": null}	f	2026-06-16 12:30:25.544786
31	7	LEAVE	Leave Approved	Your CL leave request (Wed Jun 17 2026 00:00:00 GMT+0800 (Philippine Standard Time) to Thu Jun 18 2026 00:00:00 GMT+0800 (Philippine Standard Time)) has been approved	2	{"status": "APPROVED", "to_date": "2026-06-17T16:00:00.000Z", "leave_id": 2, "from_date": "2026-06-16T16:00:00.000Z", "leave_type": "CL", "day_fraction": 1, "half_day_type": null}	f	2026-06-16 12:30:37.888046
\.


--
-- Data for Name: overtime_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.overtime_requests (id, employee_id, date, start_time, end_time, hours, reason, status, created_at, approved_by, approved_at, rejected_by, rejected_at, rejected_reason, updated_at, is_paid, paid_at, paid_in_payroll_id) FROM stdin;
\.


--
-- Data for Name: pay_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pay_rules (id, day_type, multiplier) FROM stdin;
2	SPECIAL_NON_WORKING	2.00
3	SPECIAL_HOLIDAY	3.00
4	REGULAR_HOLIDAY	4.00
1	REGULAR	1.00
5	REST_DAY	1.30
\.


--
-- Data for Name: payroll; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payroll (id, employee_id, month, year, basic_salary, overtime_pay, deductions, net_salary, status, created_at, late_deduction, absent_deduction, government_deduction, cutoff_start, cutoff_end, pay_date, rule_snapshot, leave_conversion, branch_id, night_differential_hours, night_differential_pay, paid_at, paid_by, locked_at, locked_by, voided_at, voided_by) FROM stdin;
45	3	6	2026	0.00	0.00	0.00	0.00	UNPAID	2026-06-17 14:16:17.085711	0.00	0.00	0.00	2026-06-15	2026-06-19	2026-06-25	{"overtime": {"pay": 0, "rate": 1.25, "hours": 0, "request_ids": []}, "breakdown": {"REGULAR": {"pay": 0, "days": 0, "units": 0, "multiplier": 1}, "REST_DAY": {"pay": 0, "days": 0, "units": 0, "multiplier": 1.3}, "REGULAR_HOLIDAY": {"pay": 0, "days": 0, "units": 0, "multiplier": 4}, "SPECIAL_HOLIDAY": {"pay": 0, "days": 0, "units": 0, "multiplier": 3}, "SPECIAL_NON_WORKING": {"pay": 0, "days": 0, "units": 0, "multiplier": 2}}, "pay_rules": {"REGULAR": 1, "REST_DAY": 1.3, "REGULAR_HOLIDAY": 4, "SPECIAL_HOLIDAY": 3, "SPECIAL_NON_WORKING": 2}, "daily_rate": 0, "late_count": 0, "absent_days": 4, "late_minutes": 0, "paid_leave_days": 0, "attendance_rules": {"id": 2, "is_active": true, "created_at": "2026-06-10T04:08:28.953Z", "grace_period": 15, "late_threshold": 30, "max_work_hours": 10, "late_deduction_type": "PER_MINUTE", "late_deduction_value": "5.50", "late_deduction_enabled": true}, "leave_conversion": {"amount": 0, "converted": false, "conversion_year": null}, "unpaid_leave_days": 0, "night_differential": {"pay": 0, "rate": 0.1, "hours": 0}, "total_work_units_raw": 0, "late_deduction_config": {"type": "PER_MINUTE", "value": 5.5, "enabled": true, "has_employee_override": false}, "working_days_in_cutoff": 4, "working_days_per_month": 26, "total_work_units_weighted": 0}	0	1	0.00	0.00	\N	\N	\N	\N	\N	\N
47	10	6	2026	0.00	0.00	0.00	0.00	UNPAID	2026-06-17 14:16:17.085711	0.00	0.00	0.00	2026-06-15	2026-06-19	2026-06-25	{"overtime": {"pay": 0, "rate": 1.25, "hours": 0, "request_ids": []}, "breakdown": {"REGULAR": {"pay": 0, "days": 0, "units": 0, "multiplier": 1}, "REST_DAY": {"pay": 0, "days": 0, "units": 0, "multiplier": 1.3}, "REGULAR_HOLIDAY": {"pay": 0, "days": 0, "units": 0, "multiplier": 4}, "SPECIAL_HOLIDAY": {"pay": 0, "days": 0, "units": 0, "multiplier": 3}, "SPECIAL_NON_WORKING": {"pay": 0, "days": 0, "units": 0, "multiplier": 2}}, "pay_rules": {"REGULAR": 1, "REST_DAY": 1.3, "REGULAR_HOLIDAY": 4, "SPECIAL_HOLIDAY": 3, "SPECIAL_NON_WORKING": 2}, "daily_rate": 0, "late_count": 0, "absent_days": 4, "late_minutes": 0, "paid_leave_days": 0, "attendance_rules": {"id": 2, "is_active": true, "created_at": "2026-06-10T04:08:28.953Z", "grace_period": 15, "late_threshold": 30, "max_work_hours": 10, "late_deduction_type": "PER_MINUTE", "late_deduction_value": "5.50", "late_deduction_enabled": true}, "leave_conversion": {"amount": 0, "converted": false, "conversion_year": null}, "unpaid_leave_days": 0, "night_differential": {"pay": 0, "rate": 0.1, "hours": 0}, "total_work_units_raw": 0, "late_deduction_config": {"type": "PER_MINUTE", "value": 5.5, "enabled": true, "has_employee_override": false}, "working_days_in_cutoff": 4, "working_days_per_month": 26, "total_work_units_weighted": 0}	0	1	0.00	0.00	\N	\N	\N	\N	\N	\N
48	11	6	2026	0.00	0.00	0.00	0.00	UNPAID	2026-06-17 14:16:17.085711	0.00	0.00	0.00	2026-06-15	2026-06-19	2026-06-25	{"overtime": {"pay": 0, "rate": 1.25, "hours": 0, "request_ids": []}, "breakdown": {"REGULAR": {"pay": 0, "days": 1, "units": 1, "multiplier": 1}, "REST_DAY": {"pay": 0, "days": 0, "units": 0, "multiplier": 1.3}, "REGULAR_HOLIDAY": {"pay": 0, "days": 0, "units": 0, "multiplier": 4}, "SPECIAL_HOLIDAY": {"pay": 0, "days": 0, "units": 0, "multiplier": 3}, "SPECIAL_NON_WORKING": {"pay": 0, "days": 1, "units": 1, "multiplier": 2}}, "pay_rules": {"REGULAR": 1, "REST_DAY": 1.3, "REGULAR_HOLIDAY": 4, "SPECIAL_HOLIDAY": 3, "SPECIAL_NON_WORKING": 2}, "daily_rate": 0, "late_count": 0, "absent_days": 2, "late_minutes": 0, "paid_leave_days": 2, "attendance_rules": {"id": 2, "is_active": true, "created_at": "2026-06-10T04:08:28.953Z", "grace_period": 15, "late_threshold": 30, "max_work_hours": 10, "late_deduction_type": "PER_MINUTE", "late_deduction_value": "5.50", "late_deduction_enabled": true}, "leave_conversion": {"amount": 0, "converted": false, "conversion_year": null}, "unpaid_leave_days": 0, "night_differential": {"pay": 0, "rate": 0.1, "hours": 0}, "total_work_units_raw": 2, "late_deduction_config": {"type": "PER_MINUTE", "value": 5.5, "enabled": true, "has_employee_override": false}, "working_days_in_cutoff": 4, "working_days_per_month": 26, "total_work_units_weighted": 2}	0	1	0.00	0.00	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: payroll_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payroll_rules (id, rule_key, rule_value, description, created_at, updated_at) FROM stdin;
1	night_differential_enabled	1.0000	\N	2026-06-10 13:52:16.377914	2026-06-10 13:52:16.377914
2	holiday_rest_day_method	1.0000	Holiday on rest day calculation method: 1=multiply, 2=additive minus 1, 3=max	2026-06-17 13:38:52.185361	2026-06-17 13:38:52.185361
\.


--
-- Data for Name: payroll_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payroll_settings (id, type, first_cutoff_day, second_cutoff_day, pay_day, created_at) FROM stdin;
\.


--
-- Data for Name: raw_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.raw_logs (id, device_id, employee_code, "timestamp", created_at, raw_payload, source, status, error_message, processed_at, retry_count, last_retry_at, processing_started_at) FROM stdin;
\.


--
-- Data for Name: recruitment_workflow_stages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recruitment_workflow_stages (id, workflow_id, stage_name, stage_type, stage_category, sequence_order, is_required, requires_assignment, requires_score, requires_approval, passing_score, next_stage_on_pass, next_stage_on_fail, allow_skip, auto_proceed_on_pass, days_to_complete, is_terminal, created_at, updated_at) FROM stdin;
1	1	Initial Interview	INTERVIEW	HR	1	t	f	f	f	\N	\N	\N	f	f	\N	f	2026-06-12 18:48:04.454416	2026-06-12 18:48:04.454416
2	1	Technical Test	EXAM	Skill Test	2	t	t	t	f	70.00	\N	\N	f	f	\N	f	2026-06-12 18:49:05.440848	2026-06-12 18:49:05.440848
3	1	Final Interview	INTERVIEW	HR	3	t	f	f	f	\N	\N	\N	f	f	\N	f	2026-06-12 18:50:04.328111	2026-06-12 18:50:04.328111
4	1	Passing Documents	DOCUMENT_CHECK	HR	4	t	f	f	f	\N	\N	\N	f	f	\N	f	2026-06-12 18:51:11.197385	2026-06-12 18:51:11.197385
5	1	Completed Applicant	CONVERT_TO_EMPLOYEE	HR	5	t	f	f	f	\N	\N	\N	f	f	\N	t	2026-06-12 18:52:00.242089	2026-06-12 18:52:00.242089
\.


--
-- Data for Name: recruitment_workflows; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recruitment_workflows (id, name, description, branch_id, job_position_id, is_default, is_active, version, created_at, updated_at) FROM stdin;
1	Standard	\N	\N	\N	t	t	1	2026-06-12 18:46:56.36688	2026-06-12 18:46:56.36688
\.


--
-- Data for Name: rotation_group_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rotation_group_assignments (id, group_id, pattern_id, effective_date, end_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: rotation_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rotation_groups (id, name, code, description, is_active, created_at, updated_at) FROM stdin;
1	Production A	Prod-A	\N	t	2026-06-11 15:52:19.967918	2026-06-11 15:52:19.967918
\.


--
-- Data for Name: rotation_pattern_steps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rotation_pattern_steps (id, pattern_id, day_offset, shift_id, is_rest_day) FROM stdin;
\.


--
-- Data for Name: rotation_patterns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rotation_patterns (id, name, description, cycle_days, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: shift_schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shift_schedules (id, name, type, start_time, end_time, description, is_active, created_at, updated_at, code, break_start, break_end, grace_minutes, required_hours, flex_start_window, flex_end_window, is_night_shift, is_flexitime) FROM stdin;
\.


--
-- Data for Name: smtp_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.smtp_settings (id, host, port, encryption, username, password, from_email, from_name, is_active, test_email_sent, last_test_sent_at, created_at, updated_at) FROM stdin;
1	smtp.gmail.com	587	tls	empuertojohnellchess@gmail.com	gschuqredxetzsng	empuertojohnellchess@gmail.com	UnivoHr System	t	t	2026-06-11 15:05:28.212456	2026-06-10 09:40:10.989898	2026-06-11 15:05:28.212456
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_settings (id, key, value, description, updated_at) FROM stdin;
3	enable_web_clock_in_out	true	\N	2026-06-10 12:08:40.097791
4	employee_code_separator		\N	2026-06-11 15:35:19.529226
6	employee_code_prefix	EMP	\N	2026-06-11 15:35:19.538151
8	employee_code_auto_generate	true	\N	2026-06-11 15:35:19.577524
1	employee_code_padding	3	\N	2026-06-11 15:35:19.585835
7	employee_code_counter	3	\N	2026-06-16 08:34:06.151586
\.


--
-- Data for Name: system_settings_notification_backup_before_deprecation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_settings_notification_backup_before_deprecation (id, key, value, description, updated_at) FROM stdin;
\.


--
-- Data for Name: time_modification_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.time_modification_requests (id, employee_id, attendance_id, requested_check_in, requested_check_out, reason, status, reviewed_by, reviewed_at, rejection_reason, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_branch_access; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_branch_access (id, user_id, branch_id) FROM stdin;
\.


--
-- Data for Name: user_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_permissions (id, user_id, permission_key, is_allowed, created_at, updated_at) FROM stdin;
1	2	dashboard.view	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
2	2	employees.view	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
3	2	employees.create	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
4	2	employees.edit	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
5	2	employees.delete	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
6	2	attendance.view	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
7	2	attendance.view_own	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
8	2	attendance.manage	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
9	2	attendance.time_requests.approve	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
10	2	attendance.clock_in	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
11	2	leave.view	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
12	2	leave.view_own	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
13	2	leave.create	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
14	2	leave.manage	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
15	2	leave.approve	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
16	2	leave.credits.view	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
17	2	leave.credits.manage	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
18	2	leave.conversion.view	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
19	2	leave.conversion.manage	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
20	2	overtime.view	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
21	2	overtime.view_own	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
22	2	overtime.create	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
23	2	overtime.manage	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
24	2	overtime.approve	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
25	2	manhours.view	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
26	2	manhours.view_own	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
27	2	manhours.manage	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
28	2	manhours.approve	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
29	2	payroll.view	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
30	2	payroll.generate	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
31	2	payroll.mark_paid	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
32	2	payroll.settings	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
33	2	payroll.salary.manage	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
34	2	payroll.deductions.manage	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
35	2	finalpay.view	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
36	2	finalpay.manage	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
37	2	recruitment.view	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
38	2	recruitment.jobs.manage	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
39	2	recruitment.applicants.manage	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
40	2	recruitment.applicants.delete	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
41	2	recruitment.interviews.manage	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
42	2	recruitment.approvals.manage	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
43	2	recruitment.workflows.manage	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
44	2	recruitment.convert_employee	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
45	2	performance.view	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
46	2	my_performance.view	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
47	2	performance.templates.manage	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
48	2	performance.evaluations.manage	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
49	2	forms.view	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
50	2	forms.view_own	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
51	2	forms.builder.manage	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
52	2	forms.assignments.manage	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
53	2	forms.submissions.view	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
54	2	reports.view	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
55	2	reports.employee	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
56	2	reports.attendance	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
57	2	reports.leave	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
58	2	reports.payroll	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
59	2	reports.benefits	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
60	2	reports.performance	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
61	2	settings.view	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
62	2	settings.system	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
63	2	settings.attendance_rules	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
64	2	settings.approvals	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
65	2	settings.notifications	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
66	2	settings.smtp	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
67	2	settings.email_templates	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
68	2	settings.branding	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
69	2	users.view	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
70	2	users.manage	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
71	2	branches.view	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
72	2	branches.manage	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
73	2	devices.view	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
74	2	devices.manage	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
75	2	device_logs.view	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
76	2	device_logs.manage	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
77	2	audit_logs.view	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
78	2	anomalies.view	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
79	2	drilldown.view	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
80	2	analytics.view	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
81	2	forecasting.view	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
82	2	calendar.view	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
83	2	calendar.manage	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
84	2	hr_policies.view	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
85	2	hr_policies.manage	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
86	2	notifications.view	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
87	2	profile.view	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
88	2	profile.edit_own	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
89	2	change_password	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
90	2	benefits.view_own	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
91	2	policies.view	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
92	2	self_service.view	t	2026-06-10 09:30:50.782156	2026-06-10 09:30:50.782156
140	5	dashboard.view	t	2026-06-10 11:48:24.37125	2026-06-10 11:48:24.37125
141	5	attendance.view	t	2026-06-10 11:48:24.37125	2026-06-10 11:48:24.37125
142	5	attendance.clock_in	t	2026-06-10 11:48:24.37125	2026-06-10 11:48:24.37125
143	5	leave.view	t	2026-06-10 11:48:24.37125	2026-06-10 11:48:24.37125
144	5	overtime.view	t	2026-06-10 11:48:24.37125	2026-06-10 11:48:24.37125
145	5	manhours.view	t	2026-06-10 11:48:24.37125	2026-06-10 11:48:24.37125
146	5	hr_policies.view	t	2026-06-10 11:48:24.37125	2026-06-10 11:48:24.37125
147	5	calendar.view	t	2026-06-10 11:48:24.37125	2026-06-10 11:48:24.37125
148	5	notifications.view	t	2026-06-10 11:48:24.37125	2026-06-10 11:48:24.37125
149	5	my_performance.view	t	2026-06-10 11:48:24.37125	2026-06-10 11:48:24.37125
150	5	profile.view	t	2026-06-10 11:48:24.37125	2026-06-10 11:48:24.37125
151	5	change_password	t	2026-06-10 11:48:24.37125	2026-06-10 11:48:24.37125
152	7	leave.view	t	2026-06-16 12:30:18.872644	2026-06-16 12:30:18.872644
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_sessions (id, user_id, refresh_token_hash, device_name, browser, ip_address, user_agent, is_active, last_activity_at, expires_at, created_at) FROM stdin;
29	2	b9891d299f9c4b49b1e37d1963e7180ba0db1018c349c26d09b09ac80a2f0793			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 11:21:45.094369+08	2026-06-17 11:21:45.092+08	2026-06-10 11:21:45.094369+08
30	2	a4beb673467dcf4fbaa9231169b385618111097883fa86ca2d3454aa82df2c24			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 11:21:56.603075+08	2026-06-17 11:21:56.601+08	2026-06-10 11:21:56.603075+08
1	2	8a4b3fc1bb33b30530938514838f36a4303db90ed5aa39b79c903fe0582ea2fe			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-10 09:30:56.49191+08	2026-06-17 09:30:56.49+08	2026-06-10 09:30:56.49191+08
31	2	aad14d667ccf5d23bfa4d20f91f1b45955e4d2b66fe4bcef3d9a9cc96c19a60d			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 11:22:18.583032+08	2026-06-17 11:22:18.581+08	2026-06-10 11:22:18.583032+08
32	2	bff6e9a32ba1a3abb3beb694f90b3fdbbac9de5436c080e2621ae6f5a811627b			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 11:22:36.628686+08	2026-06-17 11:22:36.627+08	2026-06-10 11:22:36.628686+08
2	2	e1f9fccf329a31ba493c78df58b740275f1cb7010d06529c11b776d159610921			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-10 09:46:23.744242+08	2026-06-17 09:46:23.743+08	2026-06-10 09:46:23.744242+08
33	2	5ba427da0a68d8ac787d54dd3be4342d034951560352be8153984388041837a4			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 11:22:36.911189+08	2026-06-17 11:22:36.91+08	2026-06-10 11:22:36.911189+08
3	2	42520584f7cd1a7a836e477bc33999d4f98177c96ae3ddaf22b0ba485aaa62c0			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-10 10:05:10.099911+08	2026-06-17 10:05:10.098+08	2026-06-10 10:05:10.099911+08
113	2	0175ee34e5e180e1aca8f09a4ebdfa6448544f16172417e655ea10ae9110433d			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	t	2026-06-16 12:20:52.483266+08	2026-06-23 12:20:52.482+08	2026-06-16 12:20:52.483266+08
4	2	98e7fabf59c8533d4585bf08642f2f88f3700b87d0b2d53c5e0aabe850fe506e			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-10 10:23:14.542702+08	2026-06-17 10:23:14.541+08	2026-06-10 10:23:14.542702+08
5	2	9739d191622e9ae80ba86b2a862cad9c30d6a30e72b999b45c032450942c56a8			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-10 10:38:41.089823+08	2026-06-17 10:38:41.088+08	2026-06-10 10:38:41.089823+08
6	2	1ce0a2c28262b24694692397a9ddeae910f61324f5aa118589e7f75897152b59			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 10:55:57.474597+08	2026-06-17 10:55:57.473+08	2026-06-10 10:55:57.474597+08
7	2	a3608fcdccfe5300795e08bdf3196a9f07e4da854c5ca1b375533746e8e460ac			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 10:56:05.613043+08	2026-06-17 10:56:05.612+08	2026-06-10 10:56:05.613043+08
8	2	07f868b763ab81bfb03e009118f18c1b02f673a090d9635fa460bf7345b7ad07			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 10:56:13.435118+08	2026-06-17 10:56:13.434+08	2026-06-10 10:56:13.435118+08
9	2	49b8fd6f7c3bdcb2921d117834cb721e717467175078df5c25a272fbee86de6d			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 10:56:23.316826+08	2026-06-17 10:56:23.316+08	2026-06-10 10:56:23.316826+08
10	2	7c9a4fec9a62c00011bb52514abbdeb57c8e4e0688addbc1835b978c6ef330fb			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 10:56:48.952059+08	2026-06-17 10:56:48.951+08	2026-06-10 10:56:48.952059+08
11	2	b50e7563c0ae5669dfe44bd65055d3e166c429e93a2d00e2384bec8974fbfc76			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 10:56:59.238998+08	2026-06-17 10:56:59.238+08	2026-06-10 10:56:59.238998+08
12	2	38c92fc7f3d164032d1bfed2a4cb92d74f9225e5f90a21521040e28011fa8c81			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 10:57:56.514952+08	2026-06-17 10:57:56.514+08	2026-06-10 10:57:56.514952+08
13	2	240d371689c3e115bfee66c2166eb8df200a18a71f608cee9d779fb4f724716e			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 11:05:21.354697+08	2026-06-17 11:05:21.354+08	2026-06-10 11:05:21.354697+08
14	2	22324ac93ef00162145e371b1ff0720af65b4e5526e5761e755a39e4eec6d96f			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 11:05:31.991295+08	2026-06-17 11:05:31.99+08	2026-06-10 11:05:31.991295+08
15	2	43620c4d838a9e5dd6fcd039f2b3783cb758174b6a94f0459374d63cc4484632			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 11:05:44.445954+08	2026-06-17 11:05:44.445+08	2026-06-10 11:05:44.445954+08
16	2	5ed327972d0d1d612598bf424b28161605f64c60e8936d5e82d447017d0edd24			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 11:06:08.656105+08	2026-06-17 11:06:08.655+08	2026-06-10 11:06:08.656105+08
17	2	d04eb113391cc3e8c1a7767da91319377d5f058f3c34f04878a69defabbc4b48			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 11:06:16.967074+08	2026-06-17 11:06:16.966+08	2026-06-10 11:06:16.967074+08
18	2	a30ef331fddcd8d480d8f696a5b2e43f002c3ef66e2d1f8e28582bf98e545f30			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 11:06:36.996734+08	2026-06-17 11:06:36.995+08	2026-06-10 11:06:36.996734+08
19	2	e2b38e1c84dc713ff2439108e5fd0b45ef4897a863aa170dc84e99f958a81c7f			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 11:07:13.094064+08	2026-06-17 11:07:13.093+08	2026-06-10 11:07:13.094064+08
20	2	9a8d0df2092ecc4551dcda73d29a5938b6d49d60697b69bba9c4dcfb83c828f9			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 11:07:24.252293+08	2026-06-17 11:07:24.251+08	2026-06-10 11:07:24.252293+08
21	2	548f01ce9755ca858b73e4e4cc843f4cb9b55bb6c0398e7a9b03bdfda0b6255b			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-10 11:11:41.690402+08	2026-06-17 11:11:41.689+08	2026-06-10 11:11:41.690402+08
22	2	7a89e357b52b1f6e0bf833605249a4a43394926f13387b903a56e2533338594a			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 11:14:11.041893+08	2026-06-17 11:14:11.041+08	2026-06-10 11:14:11.041893+08
23	2	63125a8c63eb819158897f39eb8e3783d302bfafb78b6489a59111ea2bc00168			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 11:14:22.839455+08	2026-06-17 11:14:22.838+08	2026-06-10 11:14:22.839455+08
24	2	21871d98633f0c88b2c7f719857a37164b936c6b533e270be95d48e30e1122e7			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 11:14:32.200951+08	2026-06-17 11:14:32.2+08	2026-06-10 11:14:32.200951+08
25	2	061de8a06e037445915c26d937ec36c6ffc63a01991faedb1b24bb42304ac6c0			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 11:14:43.918636+08	2026-06-17 11:14:43.917+08	2026-06-10 11:14:43.918636+08
26	2	a6120fa6522a0be705b54a6b541792ef307d157857726497cef59e2f2c0a9e08			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 11:15:26.678008+08	2026-06-17 11:15:26.677+08	2026-06-10 11:15:26.678008+08
27	2	b1e4751328c7580b08532ae79bac81ba0a674e0261310f555e7e1edce7bb5e0d			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 11:15:33.792454+08	2026-06-17 11:15:33.791+08	2026-06-10 11:15:33.792454+08
28	2	f09f2064c19f58b9177c2564c18b3026b019d1789046a068fd5f7ef48696d4c0			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 11:15:55.632039+08	2026-06-17 11:15:55.631+08	2026-06-10 11:15:55.632039+08
65	2	dbe8406e6f592f80326c49f128efabcefe3b383b69813b8dfae59a932f89ee86			::ffff:192.168.2.59	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-11 15:51:42.176316+08	2026-06-18 15:51:42.175+08	2026-06-11 15:51:42.176316+08
55	2	b3113c0e28cf450377ffa029f59deec6c1e05eb160e5a2d4f94c54513f1c02b9			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 12:09:28.524813+08	2026-06-17 12:09:28.523+08	2026-06-10 12:09:28.524813+08
56	2	d7abb28863b27f6e2090b49b9248a27570629f97d076981b86eecb33923851fb			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 12:09:42.374436+08	2026-06-17 12:09:42.373+08	2026-06-10 12:09:42.374436+08
57	2	c0ca352abd40fa207ba1309d5e228c86509b6662d60771a50a14db0908f65668			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 12:10:37.662949+08	2026-06-17 12:10:37.661+08	2026-06-10 12:10:37.662949+08
101	2	e4771ed4fc75e86d06b071c9668b0e8d1f0e38fa7aac3ccb15e112aa2b70cb92			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-16 09:48:37.484418+08	2026-06-23 09:48:37.482+08	2026-06-16 09:48:37.484418+08
34	2	7f78a0b4b2802b738a1828068e968cd046eafff4f399221fbebd071a5890b883			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 11:25:38.350396+08	2026-06-17 11:25:38.349+08	2026-06-10 11:25:38.350396+08
35	2	198d4598a8c034fdc9b4439140c3661a5805eaf8042c9f03c11da128a0edbb87			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 11:34:08.239665+08	2026-06-17 11:34:08.238+08	2026-06-10 11:34:08.239665+08
36	2	73c4ce34906c594eba81da38b7ddb1717cd0a35de3e01d965025f1f8cc42bc83			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 11:34:46.041426+08	2026-06-17 11:34:46.04+08	2026-06-10 11:34:46.041426+08
37	2	fba861044be1eb27c3021ea5a3c36c8efdb4fed6cdfa3ec28a743292175c3ebb			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 11:34:58.543742+08	2026-06-17 11:34:58.542+08	2026-06-10 11:34:58.543742+08
38	2	64a8dc16b77948d4830bc4fa50b32e95f21236c3e83f64fff293f45a5087a80f			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 11:35:05.431516+08	2026-06-17 11:35:05.43+08	2026-06-10 11:35:05.431516+08
39	2	256b383c7f6b6853c4592e8a78a45ff7e07294ee3e0a1b9ecb953ed16896421f			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 11:35:53.188936+08	2026-06-17 11:35:53.188+08	2026-06-10 11:35:53.188936+08
40	2	f690c86b7a7ce372f6a0d195c50d8a8e0b3bda84befbb63785f9ddeca80afbdd			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-10 11:39:04.868795+08	2026-06-17 11:39:04.867+08	2026-06-10 11:39:04.868795+08
41	2	5f7ff2faddac3dd07db9ed9e90ecf240cfe718211864098433b317444b3256c0			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 11:47:03.504122+08	2026-06-17 11:47:03.503+08	2026-06-10 11:47:03.504122+08
47	5	6891719cfa5330ed887c73511a315693082d9c6f5ac1644b819cdd4a67ebdc08			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	t	2026-06-10 11:48:24.470985+08	2026-06-17 11:48:24.469+08	2026-06-10 11:48:24.470985+08
42	2	33367324c8be1bc5e6d95477136b3ce73c580d9aae0251711821cac6f35212f6			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 11:47:24.768927+08	2026-06-17 11:47:24.768+08	2026-06-10 11:47:24.768927+08
43	2	dd92e14325945f27c9b9f75e0b06c66388c73a971e6a11f5b5fe244be3dd2b72			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 11:47:41.304706+08	2026-06-17 11:47:41.303+08	2026-06-10 11:47:41.304706+08
44	2	98f7408b8c6e1d5b6eed1c50826625e6456bd5490c7b1870ab6966fa59e1bad9			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 11:47:59.409852+08	2026-06-17 11:47:59.409+08	2026-06-10 11:47:59.409852+08
45	2	111a9c4fdd6631fd5d6fe64a5442606a970782610b4f145f25e03fd62aa45619			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 11:48:10.155083+08	2026-06-17 11:48:10.154+08	2026-06-10 11:48:10.155083+08
46	2	9e2900c80b193b341c45c29c47b71f5c399f6870fd6c20a7a7584ef3af8f64d4			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 11:48:24.092408+08	2026-06-17 11:48:24.091+08	2026-06-10 11:48:24.092408+08
48	2	00fd0e6a2da2f6596287eb466cc24c82514f4e5e74f206accbef3c5391449304			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 11:49:32.163012+08	2026-06-17 11:49:32.16+08	2026-06-10 11:49:32.163012+08
49	2	d04b1c24d06218bbb6dd6728ad4f61a5c188ec42045c967f208d9ed1e81612f3			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 11:49:41.296306+08	2026-06-17 11:49:41.294+08	2026-06-10 11:49:41.296306+08
50	2	f2c6ec5520e5c170d5ece7be2c0b71d357dfc76d9abf54764d823f62ba3e5553			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 11:49:51.165921+08	2026-06-17 11:49:51.164+08	2026-06-10 11:49:51.165921+08
51	2	9b358eb12b48ea376bc2f35451ec497ced223a0d6018911b7dd53ee5ae60c8ab			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 11:50:17.13028+08	2026-06-17 11:50:17.129+08	2026-06-10 11:50:17.13028+08
52	2	9a79c658065164f774c9eb494aa33be9d3014d500634d8070c733db7e5f6257b			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-10 12:03:18.821186+08	2026-06-17 12:03:18.82+08	2026-06-10 12:03:18.821186+08
53	2	25b9f0db868fa7604db286b79287527584e54cdb47ec91b56e14906d89c00288			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 12:08:28.7891+08	2026-06-17 12:08:28.788+08	2026-06-10 12:08:28.7891+08
58	2	6aba4978af9bf292b2730dbf3d84dbadb49be2d981449bb3d9cb159c672278ad			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-10 13:10:36.000356+08	2026-06-17 13:10:35.999+08	2026-06-10 13:10:36.000356+08
59	2	5b84c878c4405690b74d6ebddde007b7f0f11ce0a730fccd80080be88eec016f			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-10 13:27:20.579947+08	2026-06-17 13:27:20.578+08	2026-06-10 13:27:20.579947+08
60	2	112f2394ec1d094b53e83204c6e18005734d8b2cc70110ec60d6129330e7788e			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-10 13:42:29.702153+08	2026-06-17 13:42:29.701+08	2026-06-10 13:42:29.702153+08
61	2	e0d0844a795a363234c272072380a6b9e148a062542f07a722dc3546cdce3b99			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-10 13:59:43.031545+08	2026-06-17 13:59:43.03+08	2026-06-10 13:59:43.031545+08
62	2	fa1d804d5e60e65806617cc080a28d52f40fe49ee77bf91a9e3d1476df1a8596			::ffff:192.168.2.59	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-11 14:56:48.998043+08	2026-06-18 14:56:48.996+08	2026-06-11 14:56:48.998043+08
63	2	e52b948f92267468ac252373d84f8db0a6dbacf0ede88ff391cf6e77693c12d4			::ffff:192.168.2.59	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-11 15:16:16.298766+08	2026-06-18 15:16:16.298+08	2026-06-11 15:16:16.298766+08
64	2	ab27ba224b1ecb0b0f9f8aaa737370ce94620e8ea31e724aad255f3a10c074e5			::ffff:192.168.2.59	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-11 15:34:09.403546+08	2026-06-18 15:34:09.402+08	2026-06-11 15:34:09.403546+08
66	2	0b3b1d44acf3a18e5d4a31b203f132805fdc902c0e005ae512db3e0d09ee9a27			::ffff:192.168.2.59	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-11 16:08:44.716827+08	2026-06-18 16:08:44.715+08	2026-06-11 16:08:44.716827+08
54	2	b26018196a71cdf1a7f68fb93472f1c61343d9a5b4e82d8b4fe6dc34f2440e03			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-10 12:08:40.020667+08	2026-06-17 12:08:40.019+08	2026-06-10 12:08:40.020667+08
67	2	27cf36a9f3d66c000d7868b7ec6d2bee0cf96e3f6c2ce99152ee5d90995a9838			::ffff:192.168.2.59	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-11 16:26:18.782054+08	2026-06-18 16:26:18.78+08	2026-06-11 16:26:18.782054+08
68	2	415eaeaeda5f2cc09b0647c8c579daf6e1cd03bd312927abe6579a6a9d95b905			::ffff:192.168.2.59	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-11 16:45:35.021708+08	2026-06-18 16:45:35.021+08	2026-06-11 16:45:35.021708+08
69	2	a668d9e8680b5fd5b846705b36502b1ad2236dc5b4103b3d8b797ff68215c0ad			::ffff:192.168.2.59	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-11 17:01:25.86001+08	2026-06-18 17:01:25.859+08	2026-06-11 17:01:25.86001+08
70	2	788e3dc8b29b56be9b2b7b8cac96c75ce5ebe2f63255a33403eda7e8f38f7508			::ffff:192.168.2.59	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-11 17:53:23.436382+08	2026-06-18 17:53:23.435+08	2026-06-11 17:53:23.436382+08
71	2	6660fc496ab51eac36ba3694cf4cc5cd414639900a96a95d2d00b0be9ef0b7ac			::ffff:192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-12 09:27:44.753163+08	2026-06-19 09:27:44.751+08	2026-06-12 09:27:44.753163+08
72	2	ee1296ee67b8acee9a5f5bb4f2f8aed55d3d1d294c22420aca2e2aab5bd0d177			::ffff:192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-12 09:37:31.926789+08	2026-06-19 09:37:31.926+08	2026-06-12 09:37:31.926789+08
73	2	877b2e098a51e5076b424878e88b51c2bc4bc5a5c00eb4750004b77056493816			::ffff:192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-12 09:56:51.983009+08	2026-06-19 09:56:51.981+08	2026-06-12 09:56:51.983009+08
74	2	59116ea328f39b94de7e1480fd2725feb2721ad60d098b8ef5c2aa5bcc99d7db			::ffff:192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-12 10:14:51.282681+08	2026-06-19 10:14:51.28+08	2026-06-12 10:14:51.282681+08
75	2	36afdea2cc16ca58c15448c5d536cea2a48ad6a24dd95a88a1686aa99421c7cf			::ffff:192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-12 10:43:07.453065+08	2026-06-19 10:43:07.451+08	2026-06-12 10:43:07.453065+08
76	2	227ba62509c67f466839f0f5220c98b8edf16020a8f701b699712db55faaa031			::ffff:192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-12 11:02:44.354622+08	2026-06-19 11:02:44.352+08	2026-06-12 11:02:44.354622+08
77	2	6d2e4ed860597b32c5ff6667aee5834aa4397cf779f4313a56b05df4aae47ae8			::ffff:192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-12 11:19:59.195086+08	2026-06-19 11:19:59.194+08	2026-06-12 11:19:59.195086+08
78	2	c79b9f3d72b846def9ecde33675709a68290536beae948b9087b0a3282638a57			::ffff:192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-12 13:03:53.500559+08	2026-06-19 13:03:53.499+08	2026-06-12 13:03:53.500559+08
79	2	79f1cb76fd0f18848075cc9714725dfa82ebe933ccdb5f9c0f23baa8e21c1c07			::ffff:192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-12 13:26:30.511133+08	2026-06-19 13:26:30.51+08	2026-06-12 13:26:30.511133+08
80	2	b5f494668958577d46b8015cae0b7981bcb52523344dabf5b7c188f0afc1bc71			::ffff:192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-12 13:58:05.07781+08	2026-06-19 13:58:05.076+08	2026-06-12 13:58:05.07781+08
81	2	71a86d4658c1934ed40d7aa4301b879299d86265126bad432db5054e56e1f021			::ffff:192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-12 14:25:59.981842+08	2026-06-19 14:25:59.98+08	2026-06-12 14:25:59.981842+08
82	2	2e693f924843455eb3c4a03a53aba4631e6c05fd3a7ffb67c69f0a20fce6d4b4			::ffff:192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-12 14:41:01.527881+08	2026-06-19 14:41:01.526+08	2026-06-12 14:41:01.527881+08
83	2	13571015fe8986f6ad56ae3c0d894f8752e6409ce321447536881fde0739b53a			::ffff:192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-12 14:59:56.922839+08	2026-06-19 14:59:56.922+08	2026-06-12 14:59:56.922839+08
84	2	34c29fd699a625383ee877758ce8ea2ee53da71e79c8c5dbadd7e916cf5056eb			::ffff:192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-12 15:31:19.552685+08	2026-06-19 15:31:19.551+08	2026-06-12 15:31:19.552685+08
85	2	1c6e929cd8644476ffdde07a91bb9ce071150a71b52bf304de0b120da5abd4e4			::ffff:192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-12 17:52:02.99449+08	2026-06-19 17:52:02.992+08	2026-06-12 17:52:02.99449+08
86	2	5adf1ded8aeda4edf4c693c0b1506676834e65b624207cc026aeac557cbad812			::ffff:192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-12 18:14:30.412753+08	2026-06-19 18:14:30.411+08	2026-06-12 18:14:30.412753+08
87	2	81e0dc52c5a86716d0a4769d7b6d957dd8587a7c572793f32877734c37508de9			::ffff:192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-12 18:42:16.822162+08	2026-06-19 18:42:16.821+08	2026-06-12 18:42:16.822162+08
88	2	28c2d5a7370aa6c53f8cc362d8ecad25ff7414561663d98525699e31c28f4c45			::ffff:192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-12 19:01:01.331679+08	2026-06-19 19:01:01.331+08	2026-06-12 19:01:01.331679+08
89	2	c5dd6ecc325f16a897d494c83e6053a480645cb6419fceee3ccbf80555328a71			::ffff:192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-13 13:17:58.492916+08	2026-06-20 13:17:58.491+08	2026-06-13 13:17:58.492916+08
90	2	cd9acbf25e1e7acfcb6554644875b362f0fec2d357f97ef01e9b0fa82348f407			::ffff:192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-13 13:34:10.921616+08	2026-06-20 13:34:10.92+08	2026-06-13 13:34:10.921616+08
91	2	50247ebe79ec3229b442eb84fcac38fd764733e571fe7c9ee771e1ce5ede8ec6			::ffff:192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-13 14:03:52.521706+08	2026-06-20 14:03:52.52+08	2026-06-13 14:03:52.521706+08
92	2	42befc46ae10b7c5c8d724cd6d17d418e702183fc68497ac74bc5d9c3caa46e5			::ffff:192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-13 14:18:52.231969+08	2026-06-20 14:18:52.23+08	2026-06-13 14:18:52.231969+08
93	2	912d2ec4857b4a49aa83b29faa9a32a307d5c81871872ebb6e722aa2c466fe80			::ffff:192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-13 14:35:26.980569+08	2026-06-20 14:35:26.978+08	2026-06-13 14:35:26.980569+08
94	2	536ce8fa69126ed10f8fcfb8adf40d9585e6e9f08966ae688fc7caa9e9b0228b			::ffff:192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-13 14:55:55.550638+08	2026-06-20 14:55:55.548+08	2026-06-13 14:55:55.550638+08
100	2	348338f1b7f8c7594270c893da6ad5cf0f085d69e681d3125744ebe33c1d3671			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-16 09:19:46.184949+08	2026-06-23 09:19:46.183+08	2026-06-16 09:19:46.184949+08
95	2	17a288141f281127364ad53350853c8d36e4648270dd5a25e728548d83b922ca			::ffff:192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-13 15:14:56.969659+08	2026-06-20 15:14:56.968+08	2026-06-13 15:14:56.969659+08
96	2	b99a55878c46edde90c3e79f09f27a621907f265acea09bd5668898c83d2c998			::ffff:192.168.0.106	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-13 15:31:46.336024+08	2026-06-20 15:31:46.334+08	2026-06-13 15:31:46.336024+08
97	2	46622093f9a892d7442701e9f58065b2bcbc507f12b1fac89960ee216678bfd7			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-16 08:08:44.877756+08	2026-06-23 08:08:44.876+08	2026-06-16 08:08:44.877756+08
102	2	99072610fd3d07d0c3e65519e28229acf04c3bd8b250e7091d4ee2b7dbdc919b			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-16 09:51:38.386188+08	2026-06-23 09:51:38.385+08	2026-06-16 09:51:38.386188+08
98	2	84f6be89738e458998d24e65fe5f872c768e087a8e4f323e339ef5345cb9b991			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-16 08:33:43.242642+08	2026-06-23 08:33:43.24+08	2026-06-16 08:33:43.242642+08
99	2	2c43e160e0af0636e4ddd857695e4f3eeda5a9f63b21f87b021fd9b8881001fa			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-16 08:59:31.400459+08	2026-06-23 08:59:31.399+08	2026-06-16 08:59:31.400459+08
103	2	d4545c51719c96ccb961f49fe6e96688cecb4a239a08bc30d9ea575714bce567			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-16 09:51:44.596315+08	2026-06-23 09:51:44.595+08	2026-06-16 09:51:44.596315+08
104	2	ca8494891c5256af8dd4b32e8efd4d1a2de2c3fbe53498864bd2ec8f3c103723			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-16 09:58:04.553333+08	2026-06-23 09:58:04.551+08	2026-06-16 09:58:04.553333+08
105	2	bef9bcd39c59f5ac46868499d60a94b6d1796aa7e98e214d1eec686ee426f3fc			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-16 09:58:16.43416+08	2026-06-23 09:58:16.433+08	2026-06-16 09:58:16.43416+08
110	2	e01c8e0b880bdb77e718faffe01e3516f2920fe88620c7512e7c5d228852d041			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-16 10:27:07.748395+08	2026-06-23 10:27:07.747+08	2026-06-16 10:27:07.748395+08
111	2	1b8745a766f4605e2e905e17294834130945b0f9ae53ad13cea37b71c10462e6			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-16 11:48:14.427995+08	2026-06-23 11:48:14.426+08	2026-06-16 11:48:14.427995+08
106	2	8e5e3c1e0ddfa0051cd9614b011efc4f544d56536aa1d635e9b9e9398c81b755			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-16 09:58:25.867812+08	2026-06-23 09:58:25.867+08	2026-06-16 09:58:25.867812+08
112	2	289635dc456c3dab106eab7d6c11704ea78550d71771401327501e10eed067d8			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-16 12:11:35.835523+08	2026-06-23 12:11:35.834+08	2026-06-16 12:11:35.835523+08
107	2	dbd5bd6a7230d9bec27d3c651bc0623b997fd01f1666c7e5a03344306a35df9c			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-16 10:00:24.400855+08	2026-06-23 10:00:24.399+08	2026-06-16 10:00:24.400855+08
115	2	99e78676a62141f3c68e244d4178e59d5e240e20cbe5b9773212d2dcae3cc41f			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	t	2026-06-16 12:28:42.47223+08	2026-06-23 12:28:42.471+08	2026-06-16 12:28:42.47223+08
116	7	138e1f2d40e4cc9fc21723cb72bcf06fc638c82231d657e092f3f7b6bee50fc9			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	t	2026-06-16 12:29:42.283005+08	2026-06-23 12:29:42.282+08	2026-06-16 12:29:42.283005+08
108	2	909a7029c09296b7fba61118a1f29c4bffc03bbb512d5828fd10e20665070a8e			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-16 10:00:34.531637+08	2026-06-23 10:00:34.53+08	2026-06-16 10:00:34.531637+08
117	2	349507fe76d382d072c27c6e6ee990fa5b492d129d4e9b9cb178c5b5d7aac45d			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	t	2026-06-16 13:47:40.739015+08	2026-06-23 13:47:40.737+08	2026-06-16 13:47:40.739015+08
114	2	8ddaeee4cd68ddcac36ecb05a89a733a5b208609ddb262a4e8c6d61ce9a08ddb			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-16 12:27:49.23613+08	2026-06-23 12:27:49.235+08	2026-06-16 12:27:49.23613+08
109	2	279e9fb05790ebf9c2c1fef3593efea080b7fbb61b551292e1451d9f360fde00			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	f	2026-06-16 10:02:38.101727+08	2026-06-23 10:02:38.1+08	2026-06-16 10:02:38.101727+08
119	2	5d8e1b2f093cd2b66c915c78391b3d68eb98d75ec98cc660c379d684641927fc			::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.8457	t	2026-06-16 14:17:56.398563+08	2026-06-23 14:17:56.397+08	2026-06-16 14:17:56.398563+08
118	2	b8eafc7d02eb55acd378fe5787804edb561946126c11d910c984bc1b1f99f77d			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-16 14:01:36.357999+08	2026-06-23 14:01:36.356+08	2026-06-16 14:01:36.357999+08
120	2	2cb2d39db7b520e4d6e6a5eb60e9c3ee4a91b27322d457897aef2dec55dabc53			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-16 14:24:44.572986+08	2026-06-23 14:24:44.572+08	2026-06-16 14:24:44.572986+08
121	2	18adc8477305e9823eea0ebfca4124c7e2201bdabaf7abda87270a25ddda48d1			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-16 14:41:36.095964+08	2026-06-23 14:41:36.094+08	2026-06-16 14:41:36.095964+08
122	2	a0fca3d8eceb87e41e977ddc6d4a6913717b0d6cb20e330f6ea9015738763a15			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-16 15:38:46.700125+08	2026-06-23 15:38:46.698+08	2026-06-16 15:38:46.700125+08
123	2	9e10611b83190b201e03114f055477f0c298fa4b37a1a35cc9dd313917559faf			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-17 12:27:18.856085+08	2026-06-24 12:27:18.854+08	2026-06-17 12:27:18.856085+08
124	2	801c66eaa329b3c6ac4db1a48b77421bfb71672d2228a9d1fc4b5dfbb2c5d024			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-17 13:31:46.25519+08	2026-06-24 13:31:46.254+08	2026-06-17 13:31:46.25519+08
125	2	a77f8f61733531f1bab7a4eaa49dddb8bd8bb0f107b0fd88e2257f8816575ac3			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	f	2026-06-17 14:14:28.818675+08	2026-06-24 14:14:28.817+08	2026-06-17 14:14:28.818675+08
126	2	5d5f6d5d8b974fc4ea15161346c2c0eb29c8409e3161e48ba1358e5b43f559b9			::ffff:192.168.0.110	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	t	2026-06-17 14:35:39.052673+08	2026-06-24 14:35:39.051+08	2026-06-17 14:35:39.052673+08
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password_hash, role, employee_id, created_at, failed_login_attempts, locked_until, last_failed_login_at) FROM stdin;
5	caltest	$2b$10$kDFiq3gOHiypqst9K7EJSeF3NVIt4Zejgjc5zsS6eVTbdh33MK6o2	EMPLOYEE	2	2026-06-10 11:48:24.369185	5	2026-06-16 12:43:07.505777	2026-06-16 12:28:07.505777
7	flowtester	$2a$12$4JbViKan11vgui3CU3xIIe9uZer/ZQTVJG64EDDgO.XwyVgxG4f5O	EMPLOYEE	11	2026-06-16 12:29:35.610749	0	\N	\N
2	admin	$2a$12$4JbViKan11vgui3CU3xIIe9uZer/ZQTVJG64EDDgO.XwyVgxG4f5O	ADMIN	1	2026-06-10 09:29:56.156074	0	\N	\N
\.


--
-- Name: _migration_020_repair_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public._migration_020_repair_log_id_seq', 1, false);


--
-- Name: anomaly_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.anomaly_logs_id_seq', 1, false);


--
-- Name: applicant_approvals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.applicant_approvals_id_seq', 1, true);


--
-- Name: applicant_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.applicant_documents_id_seq', 1, false);


--
-- Name: applicant_education_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.applicant_education_id_seq', 1, false);


--
-- Name: applicant_family_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.applicant_family_members_id_seq', 1, false);


--
-- Name: applicant_interviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.applicant_interviews_id_seq', 3, true);


--
-- Name: applicant_requirements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.applicant_requirements_id_seq', 1, false);


--
-- Name: applicant_stage_approvals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.applicant_stage_approvals_id_seq', 1, false);


--
-- Name: applicant_stage_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.applicant_stage_records_id_seq', 16, true);


--
-- Name: applicant_work_experience_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.applicant_work_experience_id_seq', 1, false);


--
-- Name: applicant_workflow_instances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.applicant_workflow_instances_id_seq', 3, true);


--
-- Name: applicants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.applicants_id_seq', 3, true);


--
-- Name: approval_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.approval_logs_id_seq', 1, false);


--
-- Name: attendance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attendance_id_seq', 60, true);


--
-- Name: attendance_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attendance_logs_id_seq', 1, false);


--
-- Name: attendance_rules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attendance_rules_id_seq', 4, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 256, true);


--
-- Name: branch_rest_days_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.branch_rest_days_id_seq', 2, true);


--
-- Name: branches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.branches_id_seq', 2, true);


--
-- Name: calendar_days_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.calendar_days_id_seq', 26, true);


--
-- Name: company_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.company_settings_id_seq', 1, true);


--
-- Name: conversion_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.conversion_logs_id_seq', 1, false);


--
-- Name: device_log_mappings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.device_log_mappings_id_seq', 1, false);


--
-- Name: devices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.devices_id_seq', 1, false);


--
-- Name: email_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.email_logs_id_seq', 1, false);


--
-- Name: email_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.email_templates_id_seq', 1, false);


--
-- Name: employee_approvers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_approvers_id_seq', 1, false);


--
-- Name: employee_deductions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_deductions_id_seq', 3, true);


--
-- Name: employee_device_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_device_users_id_seq', 1, false);


--
-- Name: employee_education_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_education_id_seq', 1, false);


--
-- Name: employee_family_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_family_members_id_seq', 1, false);


--
-- Name: employee_kpi_evaluations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_kpi_evaluations_id_seq', 1, false);


--
-- Name: employee_kpi_scores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_kpi_scores_id_seq', 1, false);


--
-- Name: employee_leave_balances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_leave_balances_id_seq', 85, true);


--
-- Name: employee_onboarding_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_onboarding_id_seq', 1, false);


--
-- Name: employee_requirements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_requirements_id_seq', 1, false);


--
-- Name: employee_rest_days_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_rest_days_id_seq', 2, true);


--
-- Name: employee_rotation_group_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_rotation_group_assignments_id_seq', 1, true);


--
-- Name: employee_salary_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_salary_id_seq', 13, true);


--
-- Name: employee_shift_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_shift_assignments_id_seq', 3, true);


--
-- Name: employee_work_experience_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_work_experience_id_seq', 1, false);


--
-- Name: employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employees_id_seq', 14, true);


--
-- Name: final_pay_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.final_pay_id_seq', 1, false);


--
-- Name: forecast_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.forecast_logs_id_seq', 1, false);


--
-- Name: hr_form_answers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hr_form_answers_id_seq', 1, false);


--
-- Name: hr_form_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hr_form_assignments_id_seq', 1, false);


--
-- Name: hr_form_fields_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hr_form_fields_id_seq', 1, false);


--
-- Name: hr_form_submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hr_form_submissions_id_seq', 1, false);


--
-- Name: hr_forms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hr_forms_id_seq', 1, false);


--
-- Name: hr_policy_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hr_policy_documents_id_seq', 1, false);


--
-- Name: job_positions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.job_positions_id_seq', 1, true);


--
-- Name: kpi_template_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.kpi_template_items_id_seq', 1, false);


--
-- Name: kpi_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.kpi_templates_id_seq', 1, false);


--
-- Name: leave_conversions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.leave_conversions_id_seq', 5, true);


--
-- Name: leave_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.leave_types_id_seq', 6, true);


--
-- Name: leaves_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.leaves_id_seq', 4, true);


--
-- Name: man_hour_report_details_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.man_hour_report_details_id_seq', 1, false);


--
-- Name: man_hour_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.man_hour_reports_id_seq', 1, false);


--
-- Name: notification_rules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notification_rules_id_seq', 29, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 31, true);


--
-- Name: overtime_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.overtime_requests_id_seq', 1, true);


--
-- Name: pay_rules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pay_rules_id_seq', 5, true);


--
-- Name: payroll_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payroll_id_seq', 48, true);


--
-- Name: payroll_rules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payroll_rules_id_seq', 2, true);


--
-- Name: payroll_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payroll_settings_id_seq', 1, false);


--
-- Name: raw_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.raw_logs_id_seq', 1, false);


--
-- Name: recruitment_workflow_stages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recruitment_workflow_stages_id_seq', 5, true);


--
-- Name: recruitment_workflows_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recruitment_workflows_id_seq', 1, true);


--
-- Name: rotation_group_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rotation_group_assignments_id_seq', 1, false);


--
-- Name: rotation_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rotation_groups_id_seq', 1, true);


--
-- Name: rotation_pattern_steps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rotation_pattern_steps_id_seq', 1, false);


--
-- Name: rotation_patterns_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rotation_patterns_id_seq', 1, false);


--
-- Name: shift_schedules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shift_schedules_id_seq', 1, false);


--
-- Name: smtp_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.smtp_settings_id_seq', 1, true);


--
-- Name: system_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.system_settings_id_seq', 9, true);


--
-- Name: time_modification_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.time_modification_requests_id_seq', 1, false);


--
-- Name: user_branch_access_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_branch_access_id_seq', 1, false);


--
-- Name: user_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_permissions_id_seq', 152, true);


--
-- Name: user_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_sessions_id_seq', 126, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 7, true);


--
-- Name: _migration_020_repair_log _migration_020_repair_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._migration_020_repair_log
    ADD CONSTRAINT _migration_020_repair_log_pkey PRIMARY KEY (id);


--
-- Name: anomaly_logs anomaly_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anomaly_logs
    ADD CONSTRAINT anomaly_logs_pkey PRIMARY KEY (id);


--
-- Name: applicant_approvals applicant_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_approvals
    ADD CONSTRAINT applicant_approvals_pkey PRIMARY KEY (id);


--
-- Name: applicant_documents applicant_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_documents
    ADD CONSTRAINT applicant_documents_pkey PRIMARY KEY (id);


--
-- Name: applicant_education applicant_education_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_education
    ADD CONSTRAINT applicant_education_pkey PRIMARY KEY (id);


--
-- Name: applicant_family_members applicant_family_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_family_members
    ADD CONSTRAINT applicant_family_members_pkey PRIMARY KEY (id);


--
-- Name: applicant_interviews applicant_interviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_interviews
    ADD CONSTRAINT applicant_interviews_pkey PRIMARY KEY (id);


--
-- Name: applicant_requirements applicant_requirements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_requirements
    ADD CONSTRAINT applicant_requirements_pkey PRIMARY KEY (id);


--
-- Name: applicant_stage_approvals applicant_stage_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_stage_approvals
    ADD CONSTRAINT applicant_stage_approvals_pkey PRIMARY KEY (id);


--
-- Name: applicant_stage_records applicant_stage_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_stage_records
    ADD CONSTRAINT applicant_stage_records_pkey PRIMARY KEY (id);


--
-- Name: applicant_work_experience applicant_work_experience_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_work_experience
    ADD CONSTRAINT applicant_work_experience_pkey PRIMARY KEY (id);


--
-- Name: applicant_workflow_instances applicant_workflow_instances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_workflow_instances
    ADD CONSTRAINT applicant_workflow_instances_pkey PRIMARY KEY (id);


--
-- Name: applicants applicants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicants
    ADD CONSTRAINT applicants_pkey PRIMARY KEY (id);


--
-- Name: approval_logs approval_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approval_logs
    ADD CONSTRAINT approval_logs_pkey PRIMARY KEY (id);


--
-- Name: attendance_logs attendance_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_logs
    ADD CONSTRAINT attendance_logs_pkey PRIMARY KEY (id);


--
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- Name: attendance_rules attendance_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_rules
    ADD CONSTRAINT attendance_rules_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: branch_rest_days branch_rest_days_branch_id_day_of_week_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_rest_days
    ADD CONSTRAINT branch_rest_days_branch_id_day_of_week_key UNIQUE (branch_id, day_of_week);


--
-- Name: branch_rest_days branch_rest_days_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_rest_days
    ADD CONSTRAINT branch_rest_days_pkey PRIMARY KEY (id);


--
-- Name: branches branches_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_code_key UNIQUE (code);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: calendar_days calendar_days_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendar_days
    ADD CONSTRAINT calendar_days_pkey PRIMARY KEY (id);


--
-- Name: company_settings company_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_settings
    ADD CONSTRAINT company_settings_pkey PRIMARY KEY (id);


--
-- Name: conversion_logs conversion_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversion_logs
    ADD CONSTRAINT conversion_logs_pkey PRIMARY KEY (id);


--
-- Name: device_log_mappings device_log_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.device_log_mappings
    ADD CONSTRAINT device_log_mappings_pkey PRIMARY KEY (id);


--
-- Name: devices devices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_pkey PRIMARY KEY (id);


--
-- Name: email_logs email_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT email_logs_pkey PRIMARY KEY (id);


--
-- Name: email_templates email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_pkey PRIMARY KEY (id);


--
-- Name: email_templates email_templates_type_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_type_key UNIQUE (type);


--
-- Name: employee_approvers employee_approvers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_approvers
    ADD CONSTRAINT employee_approvers_pkey PRIMARY KEY (id);


--
-- Name: employee_deductions employee_deductions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_deductions
    ADD CONSTRAINT employee_deductions_pkey PRIMARY KEY (id);


--
-- Name: employee_device_users employee_device_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_device_users
    ADD CONSTRAINT employee_device_users_pkey PRIMARY KEY (id);


--
-- Name: employee_education employee_education_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_education
    ADD CONSTRAINT employee_education_pkey PRIMARY KEY (id);


--
-- Name: employee_family_members employee_family_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_family_members
    ADD CONSTRAINT employee_family_members_pkey PRIMARY KEY (id);


--
-- Name: employee_kpi_evaluations employee_kpi_evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_kpi_evaluations
    ADD CONSTRAINT employee_kpi_evaluations_pkey PRIMARY KEY (id);


--
-- Name: employee_kpi_scores employee_kpi_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_kpi_scores
    ADD CONSTRAINT employee_kpi_scores_pkey PRIMARY KEY (id);


--
-- Name: employee_leave_balances employee_leave_balances_employee_id_leave_type_id_year_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_leave_balances
    ADD CONSTRAINT employee_leave_balances_employee_id_leave_type_id_year_key UNIQUE (employee_id, leave_type_id, year);


--
-- Name: employee_leave_balances employee_leave_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_leave_balances
    ADD CONSTRAINT employee_leave_balances_pkey PRIMARY KEY (id);


--
-- Name: employee_onboarding employee_onboarding_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_onboarding
    ADD CONSTRAINT employee_onboarding_pkey PRIMARY KEY (id);


--
-- Name: employee_requirements employee_requirements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_requirements
    ADD CONSTRAINT employee_requirements_pkey PRIMARY KEY (id);


--
-- Name: employee_rest_days employee_rest_days_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_rest_days
    ADD CONSTRAINT employee_rest_days_pkey PRIMARY KEY (id);


--
-- Name: employee_rotation_group_assignments employee_rotation_group_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_rotation_group_assignments
    ADD CONSTRAINT employee_rotation_group_assignments_pkey PRIMARY KEY (id);


--
-- Name: employee_salary employee_salary_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_salary
    ADD CONSTRAINT employee_salary_pkey PRIMARY KEY (id);


--
-- Name: employee_shift_assignments employee_shift_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_shift_assignments
    ADD CONSTRAINT employee_shift_assignments_pkey PRIMARY KEY (id);


--
-- Name: employee_work_experience employee_work_experience_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_work_experience
    ADD CONSTRAINT employee_work_experience_pkey PRIMARY KEY (id);


--
-- Name: employees employees_employee_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_employee_code_key UNIQUE (employee_code);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: final_pay final_pay_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.final_pay
    ADD CONSTRAINT final_pay_pkey PRIMARY KEY (id);


--
-- Name: forecast_logs forecast_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forecast_logs
    ADD CONSTRAINT forecast_logs_pkey PRIMARY KEY (id);


--
-- Name: hr_form_answers hr_form_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hr_form_answers
    ADD CONSTRAINT hr_form_answers_pkey PRIMARY KEY (id);


--
-- Name: hr_form_assignments hr_form_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hr_form_assignments
    ADD CONSTRAINT hr_form_assignments_pkey PRIMARY KEY (id);


--
-- Name: hr_form_fields hr_form_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hr_form_fields
    ADD CONSTRAINT hr_form_fields_pkey PRIMARY KEY (id);


--
-- Name: hr_form_submissions hr_form_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hr_form_submissions
    ADD CONSTRAINT hr_form_submissions_pkey PRIMARY KEY (id);


--
-- Name: hr_forms hr_forms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hr_forms
    ADD CONSTRAINT hr_forms_pkey PRIMARY KEY (id);


--
-- Name: hr_policy_documents hr_policy_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hr_policy_documents
    ADD CONSTRAINT hr_policy_documents_pkey PRIMARY KEY (id);


--
-- Name: job_positions job_positions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_positions
    ADD CONSTRAINT job_positions_pkey PRIMARY KEY (id);


--
-- Name: kpi_template_items kpi_template_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kpi_template_items
    ADD CONSTRAINT kpi_template_items_pkey PRIMARY KEY (id);


--
-- Name: kpi_templates kpi_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kpi_templates
    ADD CONSTRAINT kpi_templates_pkey PRIMARY KEY (id);


--
-- Name: leave_conversions leave_conversions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_conversions
    ADD CONSTRAINT leave_conversions_pkey PRIMARY KEY (id);


--
-- Name: leave_types leave_types_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_types
    ADD CONSTRAINT leave_types_code_key UNIQUE (code);


--
-- Name: leave_types leave_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_types
    ADD CONSTRAINT leave_types_pkey PRIMARY KEY (id);


--
-- Name: leaves leaves_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leaves
    ADD CONSTRAINT leaves_pkey PRIMARY KEY (id);


--
-- Name: man_hour_report_details man_hour_report_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.man_hour_report_details
    ADD CONSTRAINT man_hour_report_details_pkey PRIMARY KEY (id);


--
-- Name: man_hour_reports man_hour_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.man_hour_reports
    ADD CONSTRAINT man_hour_reports_pkey PRIMARY KEY (id);


--
-- Name: notification_rules notification_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_rules
    ADD CONSTRAINT notification_rules_pkey PRIMARY KEY (id);


--
-- Name: notification_rules notification_rules_rule_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_rules
    ADD CONSTRAINT notification_rules_rule_key_key UNIQUE (rule_key);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: overtime_requests overtime_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.overtime_requests
    ADD CONSTRAINT overtime_requests_pkey PRIMARY KEY (id);


--
-- Name: pay_rules pay_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pay_rules
    ADD CONSTRAINT pay_rules_pkey PRIMARY KEY (id);


--
-- Name: payroll payroll_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll
    ADD CONSTRAINT payroll_pkey PRIMARY KEY (id);


--
-- Name: payroll_rules payroll_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_rules
    ADD CONSTRAINT payroll_rules_pkey PRIMARY KEY (id);


--
-- Name: payroll_rules payroll_rules_rule_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_rules
    ADD CONSTRAINT payroll_rules_rule_key_key UNIQUE (rule_key);


--
-- Name: payroll_settings payroll_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_settings
    ADD CONSTRAINT payroll_settings_pkey PRIMARY KEY (id);


--
-- Name: raw_logs raw_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.raw_logs
    ADD CONSTRAINT raw_logs_pkey PRIMARY KEY (id);


--
-- Name: recruitment_workflow_stages recruitment_workflow_stages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruitment_workflow_stages
    ADD CONSTRAINT recruitment_workflow_stages_pkey PRIMARY KEY (id);


--
-- Name: recruitment_workflows recruitment_workflows_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruitment_workflows
    ADD CONSTRAINT recruitment_workflows_pkey PRIMARY KEY (id);


--
-- Name: rotation_group_assignments rotation_group_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rotation_group_assignments
    ADD CONSTRAINT rotation_group_assignments_pkey PRIMARY KEY (id);


--
-- Name: rotation_groups rotation_groups_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rotation_groups
    ADD CONSTRAINT rotation_groups_code_key UNIQUE (code);


--
-- Name: rotation_groups rotation_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rotation_groups
    ADD CONSTRAINT rotation_groups_pkey PRIMARY KEY (id);


--
-- Name: rotation_pattern_steps rotation_pattern_steps_pattern_id_day_offset_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rotation_pattern_steps
    ADD CONSTRAINT rotation_pattern_steps_pattern_id_day_offset_key UNIQUE (pattern_id, day_offset);


--
-- Name: rotation_pattern_steps rotation_pattern_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rotation_pattern_steps
    ADD CONSTRAINT rotation_pattern_steps_pkey PRIMARY KEY (id);


--
-- Name: rotation_patterns rotation_patterns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rotation_patterns
    ADD CONSTRAINT rotation_patterns_pkey PRIMARY KEY (id);


--
-- Name: shift_schedules shift_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_schedules
    ADD CONSTRAINT shift_schedules_pkey PRIMARY KEY (id);


--
-- Name: smtp_settings smtp_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.smtp_settings
    ADD CONSTRAINT smtp_settings_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_key_key UNIQUE (key);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: time_modification_requests time_modification_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_modification_requests
    ADD CONSTRAINT time_modification_requests_pkey PRIMARY KEY (id);


--
-- Name: approval_logs unique_approval_action; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approval_logs
    ADD CONSTRAINT unique_approval_action UNIQUE (request_id, request_type, approved_by);


--
-- Name: employee_approvers unique_employee_approver_type; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_approvers
    ADD CONSTRAINT unique_employee_approver_type UNIQUE (employee_id, approval_type);


--
-- Name: attendance unique_employee_date; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT unique_employee_date UNIQUE (employee_id, date);


--
-- Name: final_pay unique_employee_final_pay; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.final_pay
    ADD CONSTRAINT unique_employee_final_pay UNIQUE (employee_id);


--
-- Name: users unique_employee_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT unique_employee_id UNIQUE (employee_id);


--
-- Name: payroll unique_employee_payroll; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll
    ADD CONSTRAINT unique_employee_payroll UNIQUE (employee_id, cutoff_start, cutoff_end);


--
-- Name: employee_salary unique_employee_salary; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_salary
    ADD CONSTRAINT unique_employee_salary UNIQUE (employee_id);


--
-- Name: leave_conversions unique_employee_year_type; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_conversions
    ADD CONSTRAINT unique_employee_year_type UNIQUE (employee_id, year, leave_type);


--
-- Name: applicant_workflow_instances uq_applicant_workflow_instance; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_workflow_instances
    ADD CONSTRAINT uq_applicant_workflow_instance UNIQUE (applicant_id);


--
-- Name: employee_device_users uq_employee_device_users; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_device_users
    ADD CONSTRAINT uq_employee_device_users UNIQUE (device_id, device_user_id);


--
-- Name: recruitment_workflow_stages uq_workflow_stage_sequence; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruitment_workflow_stages
    ADD CONSTRAINT uq_workflow_stage_sequence UNIQUE (workflow_id, sequence_order);


--
-- Name: user_branch_access user_branch_access_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_branch_access
    ADD CONSTRAINT user_branch_access_pkey PRIMARY KEY (id);


--
-- Name: user_branch_access user_branch_access_user_id_branch_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_branch_access
    ADD CONSTRAINT user_branch_access_user_id_branch_id_key UNIQUE (user_id, branch_id);


--
-- Name: user_permissions user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_pkey PRIMARY KEY (id);


--
-- Name: user_permissions user_permissions_user_id_permission_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_user_id_permission_key_key UNIQUE (user_id, permission_key);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_anomaly_anomaly_score; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_anomaly_anomaly_score ON public.anomaly_logs USING btree (anomaly_score DESC);


--
-- Name: idx_anomaly_branch_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_anomaly_branch_id ON public.anomaly_logs USING btree (branch_id);


--
-- Name: idx_anomaly_confidence; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_anomaly_confidence ON public.anomaly_logs USING btree (confidence DESC);


--
-- Name: idx_anomaly_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_anomaly_created_at ON public.anomaly_logs USING btree (created_at DESC);


--
-- Name: idx_anomaly_dedup; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_anomaly_dedup ON public.anomaly_logs USING btree (employee_id, anomaly_type, status, detected_at);


--
-- Name: idx_anomaly_detected_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_anomaly_detected_at ON public.anomaly_logs USING btree (detected_at DESC);


--
-- Name: idx_anomaly_employee_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_anomaly_employee_id ON public.anomaly_logs USING btree (employee_id);


--
-- Name: idx_anomaly_severity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_anomaly_severity ON public.anomaly_logs USING btree (severity);


--
-- Name: idx_anomaly_source_module; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_anomaly_source_module ON public.anomaly_logs USING btree (source_module);


--
-- Name: idx_anomaly_statistical_method; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_anomaly_statistical_method ON public.anomaly_logs USING btree (statistical_method);


--
-- Name: idx_anomaly_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_anomaly_status ON public.anomaly_logs USING btree (status);


--
-- Name: idx_anomaly_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_anomaly_type ON public.anomaly_logs USING btree (anomaly_type);


--
-- Name: idx_applicant_approvals_applicant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_applicant_approvals_applicant ON public.applicant_approvals USING btree (applicant_id);


--
-- Name: idx_applicant_documents_applicant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_applicant_documents_applicant ON public.applicant_documents USING btree (applicant_id);


--
-- Name: idx_applicant_education_applicant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_applicant_education_applicant ON public.applicant_education USING btree (applicant_id);


--
-- Name: idx_applicant_family_members_applicant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_applicant_family_members_applicant ON public.applicant_family_members USING btree (applicant_id);


--
-- Name: idx_applicant_interviews_applicant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_applicant_interviews_applicant ON public.applicant_interviews USING btree (applicant_id);


--
-- Name: idx_applicant_interviews_interviewer_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_applicant_interviews_interviewer_user ON public.applicant_interviews USING btree (interviewer_user_id);


--
-- Name: idx_applicant_requirements_applicant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_applicant_requirements_applicant_id ON public.applicant_requirements USING btree (applicant_id);


--
-- Name: idx_applicant_stage_approvals_applicant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_applicant_stage_approvals_applicant_id ON public.applicant_stage_approvals USING btree (applicant_id);


--
-- Name: idx_applicant_stage_approvals_decision; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_applicant_stage_approvals_decision ON public.applicant_stage_approvals USING btree (decision);


--
-- Name: idx_applicant_stage_approvals_stage_record_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_applicant_stage_approvals_stage_record_id ON public.applicant_stage_approvals USING btree (stage_record_id);


--
-- Name: idx_applicant_stage_records_applicant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_applicant_stage_records_applicant_id ON public.applicant_stage_records USING btree (applicant_id);


--
-- Name: idx_applicant_stage_records_assigned_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_applicant_stage_records_assigned_user ON public.applicant_stage_records USING btree (assigned_user_id);


--
-- Name: idx_applicant_stage_records_instance_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_applicant_stage_records_instance_id ON public.applicant_stage_records USING btree (workflow_instance_id);


--
-- Name: idx_applicant_stage_records_stage_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_applicant_stage_records_stage_id ON public.applicant_stage_records USING btree (workflow_stage_id);


--
-- Name: idx_applicant_stage_records_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_applicant_stage_records_status ON public.applicant_stage_records USING btree (status);


--
-- Name: idx_applicant_work_experience_applicant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_applicant_work_experience_applicant ON public.applicant_work_experience USING btree (applicant_id);


--
-- Name: idx_applicant_workflow_instances_applicant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_applicant_workflow_instances_applicant_id ON public.applicant_workflow_instances USING btree (applicant_id);


--
-- Name: idx_applicant_workflow_instances_workflow_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_applicant_workflow_instances_workflow_id ON public.applicant_workflow_instances USING btree (workflow_id);


--
-- Name: idx_applicants_employee_id_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_applicants_employee_id_unique ON public.applicants USING btree (employee_id) WHERE (employee_id IS NOT NULL);


--
-- Name: idx_applicants_job_position; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_applicants_job_position ON public.applicants USING btree (job_position_id);


--
-- Name: idx_applicants_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_applicants_status ON public.applicants USING btree (status);


--
-- Name: idx_approval_logs_request; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_approval_logs_request ON public.approval_logs USING btree (request_type, request_id);


--
-- Name: idx_attendance_branch_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_branch_date ON public.attendance USING btree (branch_id, date);


--
-- Name: idx_attendance_branch_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_branch_id ON public.attendance USING btree (branch_id);


--
-- Name: idx_attendance_check_in_utc; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_check_in_utc ON public.attendance USING btree (check_in_time_utc);


--
-- Name: idx_attendance_check_out_utc; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_check_out_utc ON public.attendance USING btree (check_out_time_utc);


--
-- Name: idx_attendance_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_date ON public.attendance USING btree (date);


--
-- Name: idx_attendance_device_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_device_id ON public.attendance USING btree (device_id);


--
-- Name: idx_attendance_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_employee ON public.attendance USING btree (employee_id);


--
-- Name: idx_attendance_employee_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_employee_date ON public.attendance USING btree (employee_id, date);


--
-- Name: idx_attendance_half_day; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_half_day ON public.attendance USING btree (half_day_type);


--
-- Name: idx_attendance_logs_raw_log; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_logs_raw_log ON public.attendance_logs USING btree (raw_log_id);


--
-- Name: idx_attendance_shift_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_shift_date ON public.attendance USING btree (shift_date);


--
-- Name: idx_attendance_source; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_source ON public.attendance USING btree (source);


--
-- Name: idx_attendance_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_status ON public.attendance USING btree (status);


--
-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: idx_audit_logs_branch_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_branch_id ON public.audit_logs USING btree (branch_id);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);


--
-- Name: idx_audit_logs_employee_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_employee_id ON public.audit_logs USING btree (employee_id);


--
-- Name: idx_audit_logs_record; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_record ON public.audit_logs USING btree (table_name, record_id);


--
-- Name: idx_audit_logs_table_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_table_name ON public.audit_logs USING btree (table_name);


--
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_branch_rest_days_branch; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_branch_rest_days_branch ON public.branch_rest_days USING btree (branch_id);


--
-- Name: idx_calendar_days_branch_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_calendar_days_branch_id ON public.calendar_days USING btree (branch_id);


--
-- Name: idx_conversion_logs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_conversion_logs_status ON public.conversion_logs USING btree (status);


--
-- Name: idx_conversion_logs_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_conversion_logs_year ON public.conversion_logs USING btree (year);


--
-- Name: idx_device_log_mappings_device; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_device_log_mappings_device ON public.device_log_mappings USING btree (device_id);


--
-- Name: idx_devices_branch_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_devices_branch_id ON public.devices USING btree (branch_id);


--
-- Name: idx_education_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_education_employee ON public.employee_education USING btree (employee_id);


--
-- Name: idx_email_logs_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_logs_employee ON public.email_logs USING btree (employee_id);


--
-- Name: idx_email_logs_payroll; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_logs_payroll ON public.email_logs USING btree (payroll_id);


--
-- Name: idx_email_logs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_logs_status ON public.email_logs USING btree (status);


--
-- Name: idx_emp_rest_days_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_emp_rest_days_employee ON public.employee_rest_days USING btree (employee_id);


--
-- Name: idx_emp_rest_days_lookup; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_emp_rest_days_lookup ON public.employee_rest_days USING btree (employee_id, day_of_week, effective_date, end_date);


--
-- Name: idx_emp_rotation_group_assignments_lookup; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_emp_rotation_group_assignments_lookup ON public.employee_rotation_group_assignments USING btree (employee_id, effective_date, end_date);


--
-- Name: idx_emp_shift_assignments_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_emp_shift_assignments_dates ON public.employee_shift_assignments USING btree (employee_id, effective_date, end_date);


--
-- Name: idx_emp_shift_assignments_effective; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_emp_shift_assignments_effective ON public.employee_shift_assignments USING btree (effective_date);


--
-- Name: idx_emp_shift_assignments_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_emp_shift_assignments_employee ON public.employee_shift_assignments USING btree (employee_id);


--
-- Name: idx_employee_approvers_lookup; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_approvers_lookup ON public.employee_approvers USING btree (employee_id, approver_id, approval_type);


--
-- Name: idx_employee_deductions_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_deductions_employee ON public.employee_deductions USING btree (employee_id);


--
-- Name: idx_employee_device_users_device; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_device_users_device ON public.employee_device_users USING btree (device_id);


--
-- Name: idx_employee_device_users_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_device_users_employee ON public.employee_device_users USING btree (employee_id);


--
-- Name: idx_employee_device_users_lookup; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_device_users_lookup ON public.employee_device_users USING btree (device_id, device_user_id);


--
-- Name: idx_employee_leave_balances_employee_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_leave_balances_employee_year ON public.employee_leave_balances USING btree (employee_id, year);


--
-- Name: idx_employee_leave_balances_leave_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_leave_balances_leave_type ON public.employee_leave_balances USING btree (leave_type_id);


--
-- Name: idx_employee_onboarding_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_onboarding_employee ON public.employee_onboarding USING btree (employee_id);


--
-- Name: idx_employee_onboarding_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_onboarding_status ON public.employee_onboarding USING btree (status);


--
-- Name: idx_employee_requirements_onboarding; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_requirements_onboarding ON public.employee_requirements USING btree (onboarding_id);


--
-- Name: idx_employees_branch_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employees_branch_id ON public.employees USING btree (branch_id);


--
-- Name: idx_employees_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employees_status ON public.employees USING btree (status);


--
-- Name: idx_employees_status_branch; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employees_status_branch ON public.employees USING btree (status, branch_id);


--
-- Name: idx_family_members_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_family_members_employee ON public.employee_family_members USING btree (employee_id);


--
-- Name: idx_final_pay_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_final_pay_employee ON public.final_pay USING btree (employee_id);


--
-- Name: idx_forecast_branch_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_forecast_branch_id ON public.forecast_logs USING btree (branch_id);


--
-- Name: idx_forecast_forecast_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_forecast_forecast_date ON public.forecast_logs USING btree (forecast_date DESC);


--
-- Name: idx_forecast_metric_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_forecast_metric_date ON public.forecast_logs USING btree (metric_name, forecast_date);


--
-- Name: idx_forecast_metric_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_forecast_metric_name ON public.forecast_logs USING btree (metric_name);


--
-- Name: idx_forecast_period_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_forecast_period_type ON public.forecast_logs USING btree (period_type);


--
-- Name: idx_hr_form_answers_assignment_field_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_hr_form_answers_assignment_field_unique ON public.hr_form_answers USING btree (assignment_id, field_id);


--
-- Name: idx_hr_policy_documents_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hr_policy_documents_active ON public.hr_policy_documents USING btree (is_active);


--
-- Name: idx_hr_policy_documents_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hr_policy_documents_category ON public.hr_policy_documents USING btree (category);


--
-- Name: idx_job_positions_department; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_job_positions_department ON public.job_positions USING btree (department);


--
-- Name: idx_job_positions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_job_positions_status ON public.job_positions USING btree (status);


--
-- Name: idx_leave_conversions_employee_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_conversions_employee_year ON public.leave_conversions USING btree (employee_id, year);


--
-- Name: idx_leave_conversions_year; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_conversions_year ON public.leave_conversions USING btree (year);


--
-- Name: idx_leaves_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leaves_dates ON public.leaves USING btree (from_date, to_date);


--
-- Name: idx_leaves_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leaves_employee ON public.leaves USING btree (employee_id);


--
-- Name: idx_leaves_employee_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leaves_employee_dates ON public.leaves USING btree (employee_id, from_date, to_date);


--
-- Name: idx_leaves_employee_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leaves_employee_status ON public.leaves USING btree (employee_id, status);


--
-- Name: idx_leaves_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leaves_status ON public.leaves USING btree (status);


--
-- Name: idx_mhr_details_report_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mhr_details_report_id ON public.man_hour_report_details USING btree (report_id);


--
-- Name: idx_notification_rules_enabled; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notification_rules_enabled ON public.notification_rules USING btree (is_enabled);


--
-- Name: idx_notification_rules_module; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notification_rules_module ON public.notification_rules USING btree (module);


--
-- Name: idx_notification_rules_rule_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notification_rules_rule_key ON public.notification_rules USING btree (rule_key);


--
-- Name: idx_notifications_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_created ON public.notifications USING btree (created_at DESC);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_notifications_user_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user_read ON public.notifications USING btree (user_id, is_read);


--
-- Name: idx_overtime_approved_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_overtime_approved_by ON public.overtime_requests USING btree (approved_by);


--
-- Name: idx_overtime_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_overtime_date ON public.overtime_requests USING btree (date);


--
-- Name: idx_overtime_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_overtime_employee ON public.overtime_requests USING btree (employee_id);


--
-- Name: idx_overtime_employee_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_overtime_employee_date ON public.overtime_requests USING btree (employee_id, date);


--
-- Name: idx_overtime_paid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_overtime_paid ON public.overtime_requests USING btree (is_paid, status, date);


--
-- Name: idx_overtime_rejected_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_overtime_rejected_by ON public.overtime_requests USING btree (rejected_by);


--
-- Name: idx_overtime_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_overtime_status ON public.overtime_requests USING btree (status);


--
-- Name: idx_payroll_branch_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payroll_branch_id ON public.payroll USING btree (branch_id);


--
-- Name: idx_payroll_cutoff; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payroll_cutoff ON public.payroll USING btree (cutoff_start, cutoff_end);


--
-- Name: idx_raw_logs_device_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raw_logs_device_status ON public.raw_logs USING btree (device_id, status);


--
-- Name: idx_raw_logs_source; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raw_logs_source ON public.raw_logs USING btree (source);


--
-- Name: idx_raw_logs_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raw_logs_status ON public.raw_logs USING btree (status);


--
-- Name: idx_raw_logs_status_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raw_logs_status_timestamp ON public.raw_logs USING btree (status, "timestamp");


--
-- Name: idx_raw_logs_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raw_logs_timestamp ON public.raw_logs USING btree ("timestamp");


--
-- Name: idx_rawlogs_employee_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rawlogs_employee_code ON public.raw_logs USING btree (employee_code);


--
-- Name: idx_recruitment_workflow_stages_sequence; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recruitment_workflow_stages_sequence ON public.recruitment_workflow_stages USING btree (workflow_id, sequence_order);


--
-- Name: idx_recruitment_workflow_stages_workflow_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recruitment_workflow_stages_workflow_id ON public.recruitment_workflow_stages USING btree (workflow_id);


--
-- Name: idx_recruitment_workflows_branch_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recruitment_workflows_branch_id ON public.recruitment_workflows USING btree (branch_id);


--
-- Name: idx_recruitment_workflows_default; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recruitment_workflows_default ON public.recruitment_workflows USING btree (is_default);


--
-- Name: idx_recruitment_workflows_job_position_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recruitment_workflows_job_position_id ON public.recruitment_workflows USING btree (job_position_id);


--
-- Name: idx_rotation_group_assignments_group; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rotation_group_assignments_group ON public.rotation_group_assignments USING btree (group_id, effective_date, end_date);


--
-- Name: idx_rotation_pattern_steps_pattern; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rotation_pattern_steps_pattern ON public.rotation_pattern_steps USING btree (pattern_id);


--
-- Name: idx_shift_schedules_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_shift_schedules_code ON public.shift_schedules USING btree (code);


--
-- Name: idx_tmr_attendance; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tmr_attendance ON public.time_modification_requests USING btree (attendance_id);


--
-- Name: idx_tmr_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tmr_employee ON public.time_modification_requests USING btree (employee_id);


--
-- Name: idx_user_branch_access_branch; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_branch_access_branch ON public.user_branch_access USING btree (branch_id);


--
-- Name: idx_user_branch_access_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_branch_access_user ON public.user_branch_access USING btree (user_id);


--
-- Name: idx_user_sessions_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_sessions_active ON public.user_sessions USING btree (is_active);


--
-- Name: idx_user_sessions_expires; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_sessions_expires ON public.user_sessions USING btree (expires_at);


--
-- Name: idx_user_sessions_refresh_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_sessions_refresh_hash ON public.user_sessions USING btree (refresh_token_hash);


--
-- Name: idx_user_sessions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions USING btree (user_id);


--
-- Name: idx_work_experience_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_work_experience_employee ON public.employee_work_experience USING btree (employee_id);


--
-- Name: one_active_smtp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX one_active_smtp ON public.smtp_settings USING btree (is_active) WHERE (is_active = true);


--
-- Name: unique_employee_deduction_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX unique_employee_deduction_type ON public.employee_deductions USING btree (employee_id, type);


--
-- Name: uq_calendar_days_branch_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_calendar_days_branch_date ON public.calendar_days USING btree (date, branch_id) WHERE (branch_id IS NOT NULL);


--
-- Name: uq_calendar_days_global_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_calendar_days_global_date ON public.calendar_days USING btree (date) WHERE (branch_id IS NULL);


--
-- Name: uq_emp_rest_day_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_emp_rest_day_active ON public.employee_rest_days USING btree (employee_id, day_of_week) WHERE (end_date IS NULL);


--
-- Name: man_hour_report_details check_time_overlap_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER check_time_overlap_trigger BEFORE INSERT OR UPDATE ON public.man_hour_report_details FOR EACH ROW EXECUTE FUNCTION public.check_time_overlap();


--
-- Name: anomaly_logs trg_anomaly_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_anomaly_updated_at BEFORE UPDATE ON public.anomaly_logs FOR EACH ROW EXECUTE FUNCTION public.update_anomaly_updated_at();


--
-- Name: audit_logs trg_audit_immutable; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_audit_immutable BEFORE DELETE OR UPDATE ON public.audit_logs FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_modification();


--
-- Name: employee_leave_balances trg_employee_leave_balances_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_employee_leave_balances_updated_at BEFORE UPDATE ON public.employee_leave_balances FOR EACH ROW EXECUTE FUNCTION public.update_employee_leave_balances_updated_at();


--
-- Name: man_hour_report_details update_mhr_details_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_mhr_details_updated_at BEFORE UPDATE ON public.man_hour_report_details FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: notification_rules update_notification_rules_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_notification_rules_updated_at BEFORE UPDATE ON public.notification_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: _migration_020_repair_log _migration_020_repair_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._migration_020_repair_log
    ADD CONSTRAINT _migration_020_repair_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: anomaly_logs anomaly_logs_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anomaly_logs
    ADD CONSTRAINT anomaly_logs_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: anomaly_logs anomaly_logs_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anomaly_logs
    ADD CONSTRAINT anomaly_logs_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: anomaly_logs anomaly_logs_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anomaly_logs
    ADD CONSTRAINT anomaly_logs_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: anomaly_logs anomaly_logs_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.anomaly_logs
    ADD CONSTRAINT anomaly_logs_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: applicant_approvals applicant_approvals_applicant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_approvals
    ADD CONSTRAINT applicant_approvals_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.applicants(id) ON DELETE CASCADE;


--
-- Name: applicant_approvals applicant_approvals_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_approvals
    ADD CONSTRAINT applicant_approvals_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.employees(id);


--
-- Name: applicant_documents applicant_documents_applicant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_documents
    ADD CONSTRAINT applicant_documents_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.applicants(id) ON DELETE CASCADE;


--
-- Name: applicant_education applicant_education_applicant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_education
    ADD CONSTRAINT applicant_education_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.applicants(id) ON DELETE CASCADE;


--
-- Name: applicant_family_members applicant_family_members_applicant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_family_members
    ADD CONSTRAINT applicant_family_members_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.applicants(id) ON DELETE CASCADE;


--
-- Name: applicant_interviews applicant_interviews_applicant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_interviews
    ADD CONSTRAINT applicant_interviews_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.applicants(id) ON DELETE CASCADE;


--
-- Name: applicant_interviews applicant_interviews_interviewer_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_interviews
    ADD CONSTRAINT applicant_interviews_interviewer_user_id_fkey FOREIGN KEY (interviewer_user_id) REFERENCES public.users(id);


--
-- Name: applicant_requirements applicant_requirements_applicant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_requirements
    ADD CONSTRAINT applicant_requirements_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.applicants(id) ON DELETE CASCADE;


--
-- Name: applicant_stage_approvals applicant_stage_approvals_applicant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_stage_approvals
    ADD CONSTRAINT applicant_stage_approvals_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.applicants(id) ON DELETE CASCADE;


--
-- Name: applicant_stage_approvals applicant_stage_approvals_approver_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_stage_approvals
    ADD CONSTRAINT applicant_stage_approvals_approver_employee_id_fkey FOREIGN KEY (approver_employee_id) REFERENCES public.employees(id);


--
-- Name: applicant_stage_approvals applicant_stage_approvals_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_stage_approvals
    ADD CONSTRAINT applicant_stage_approvals_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: applicant_stage_approvals applicant_stage_approvals_assigned_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_stage_approvals
    ADD CONSTRAINT applicant_stage_approvals_assigned_employee_id_fkey FOREIGN KEY (assigned_employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- Name: applicant_stage_approvals applicant_stage_approvals_assigned_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_stage_approvals
    ADD CONSTRAINT applicant_stage_approvals_assigned_user_id_fkey FOREIGN KEY (assigned_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: applicant_stage_approvals applicant_stage_approvals_stage_record_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_stage_approvals
    ADD CONSTRAINT applicant_stage_approvals_stage_record_id_fkey FOREIGN KEY (stage_record_id) REFERENCES public.applicant_stage_records(id) ON DELETE CASCADE;


--
-- Name: applicant_stage_approvals applicant_stage_approvals_workflow_stage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_stage_approvals
    ADD CONSTRAINT applicant_stage_approvals_workflow_stage_id_fkey FOREIGN KEY (workflow_stage_id) REFERENCES public.recruitment_workflow_stages(id);


--
-- Name: applicant_stage_records applicant_stage_records_applicant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_stage_records
    ADD CONSTRAINT applicant_stage_records_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.applicants(id) ON DELETE CASCADE;


--
-- Name: applicant_stage_records applicant_stage_records_assigned_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_stage_records
    ADD CONSTRAINT applicant_stage_records_assigned_employee_id_fkey FOREIGN KEY (assigned_employee_id) REFERENCES public.employees(id);


--
-- Name: applicant_stage_records applicant_stage_records_assigned_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_stage_records
    ADD CONSTRAINT applicant_stage_records_assigned_user_id_fkey FOREIGN KEY (assigned_user_id) REFERENCES public.users(id);


--
-- Name: applicant_stage_records applicant_stage_records_workflow_instance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_stage_records
    ADD CONSTRAINT applicant_stage_records_workflow_instance_id_fkey FOREIGN KEY (workflow_instance_id) REFERENCES public.applicant_workflow_instances(id) ON DELETE CASCADE;


--
-- Name: applicant_stage_records applicant_stage_records_workflow_stage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_stage_records
    ADD CONSTRAINT applicant_stage_records_workflow_stage_id_fkey FOREIGN KEY (workflow_stage_id) REFERENCES public.recruitment_workflow_stages(id);


--
-- Name: applicant_work_experience applicant_work_experience_applicant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_work_experience
    ADD CONSTRAINT applicant_work_experience_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.applicants(id) ON DELETE CASCADE;


--
-- Name: applicant_workflow_instances applicant_workflow_instances_applicant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_workflow_instances
    ADD CONSTRAINT applicant_workflow_instances_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.applicants(id) ON DELETE CASCADE;


--
-- Name: applicant_workflow_instances applicant_workflow_instances_current_stage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_workflow_instances
    ADD CONSTRAINT applicant_workflow_instances_current_stage_id_fkey FOREIGN KEY (current_stage_id) REFERENCES public.recruitment_workflow_stages(id);


--
-- Name: applicant_workflow_instances applicant_workflow_instances_workflow_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicant_workflow_instances
    ADD CONSTRAINT applicant_workflow_instances_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.recruitment_workflows(id);


--
-- Name: applicants applicants_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicants
    ADD CONSTRAINT applicants_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- Name: applicants applicants_job_position_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicants
    ADD CONSTRAINT applicants_job_position_id_fkey FOREIGN KEY (job_position_id) REFERENCES public.job_positions(id) ON DELETE SET NULL;


--
-- Name: applicants applicants_workflow_instance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applicants
    ADD CONSTRAINT applicants_workflow_instance_id_fkey FOREIGN KEY (workflow_instance_id) REFERENCES public.applicant_workflow_instances(id);


--
-- Name: attendance attendance_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: attendance attendance_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(id);


--
-- Name: attendance attendance_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: attendance_logs attendance_logs_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_logs
    ADD CONSTRAINT attendance_logs_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(id) ON DELETE SET NULL;


--
-- Name: attendance_logs attendance_logs_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_logs
    ADD CONSTRAINT attendance_logs_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- Name: attendance_logs attendance_logs_raw_log_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_logs
    ADD CONSTRAINT attendance_logs_raw_log_id_fkey FOREIGN KEY (raw_log_id) REFERENCES public.raw_logs(id) ON DELETE SET NULL;


--
-- Name: attendance attendance_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.shift_schedules(id);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: branch_rest_days branch_rest_days_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.branch_rest_days
    ADD CONSTRAINT branch_rest_days_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: calendar_days calendar_days_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendar_days
    ADD CONSTRAINT calendar_days_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: devices devices_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id);


--
-- Name: email_logs email_logs_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT email_logs_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: email_logs email_logs_payroll_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT email_logs_payroll_id_fkey FOREIGN KEY (payroll_id) REFERENCES public.payroll(id) ON DELETE CASCADE;


--
-- Name: employee_approvers employee_approvers_approver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_approvers
    ADD CONSTRAINT employee_approvers_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: employee_approvers employee_approvers_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_approvers
    ADD CONSTRAINT employee_approvers_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: employee_deductions employee_deductions_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_deductions
    ADD CONSTRAINT employee_deductions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: employee_education employee_education_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_education
    ADD CONSTRAINT employee_education_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: employee_family_members employee_family_members_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_family_members
    ADD CONSTRAINT employee_family_members_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: employee_kpi_evaluations employee_kpi_evaluations_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_kpi_evaluations
    ADD CONSTRAINT employee_kpi_evaluations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: employee_kpi_evaluations employee_kpi_evaluations_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_kpi_evaluations
    ADD CONSTRAINT employee_kpi_evaluations_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: employee_kpi_evaluations employee_kpi_evaluations_evaluator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_kpi_evaluations
    ADD CONSTRAINT employee_kpi_evaluations_evaluator_id_fkey FOREIGN KEY (evaluator_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: employee_kpi_evaluations employee_kpi_evaluations_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_kpi_evaluations
    ADD CONSTRAINT employee_kpi_evaluations_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.kpi_templates(id);


--
-- Name: employee_kpi_scores employee_kpi_scores_evaluation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_kpi_scores
    ADD CONSTRAINT employee_kpi_scores_evaluation_id_fkey FOREIGN KEY (evaluation_id) REFERENCES public.employee_kpi_evaluations(id) ON DELETE CASCADE;


--
-- Name: employee_kpi_scores employee_kpi_scores_template_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_kpi_scores
    ADD CONSTRAINT employee_kpi_scores_template_item_id_fkey FOREIGN KEY (template_item_id) REFERENCES public.kpi_template_items(id) ON DELETE CASCADE;


--
-- Name: employee_leave_balances employee_leave_balances_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_leave_balances
    ADD CONSTRAINT employee_leave_balances_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: employee_leave_balances employee_leave_balances_leave_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_leave_balances
    ADD CONSTRAINT employee_leave_balances_leave_type_id_fkey FOREIGN KEY (leave_type_id) REFERENCES public.leave_types(id);


--
-- Name: employee_onboarding employee_onboarding_applicant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_onboarding
    ADD CONSTRAINT employee_onboarding_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.applicants(id);


--
-- Name: employee_onboarding employee_onboarding_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_onboarding
    ADD CONSTRAINT employee_onboarding_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: employee_requirements employee_requirements_onboarding_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_requirements
    ADD CONSTRAINT employee_requirements_onboarding_id_fkey FOREIGN KEY (onboarding_id) REFERENCES public.employee_onboarding(id) ON DELETE CASCADE;


--
-- Name: employee_rest_days employee_rest_days_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_rest_days
    ADD CONSTRAINT employee_rest_days_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: employee_rotation_group_assignments employee_rotation_group_assignments_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_rotation_group_assignments
    ADD CONSTRAINT employee_rotation_group_assignments_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: employee_rotation_group_assignments employee_rotation_group_assignments_rotation_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_rotation_group_assignments
    ADD CONSTRAINT employee_rotation_group_assignments_rotation_group_id_fkey FOREIGN KEY (rotation_group_id) REFERENCES public.rotation_groups(id);


--
-- Name: employee_salary employee_salary_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_salary
    ADD CONSTRAINT employee_salary_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: employee_shift_assignments employee_shift_assignments_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_shift_assignments
    ADD CONSTRAINT employee_shift_assignments_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: employee_shift_assignments employee_shift_assignments_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_shift_assignments
    ADD CONSTRAINT employee_shift_assignments_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.shift_schedules(id) ON DELETE CASCADE;


--
-- Name: employee_work_experience employee_work_experience_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_work_experience
    ADD CONSTRAINT employee_work_experience_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: final_pay final_pay_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.final_pay
    ADD CONSTRAINT final_pay_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: final_pay final_pay_processed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.final_pay
    ADD CONSTRAINT final_pay_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.users(id);


--
-- Name: time_modification_requests fk_attendance; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_modification_requests
    ADD CONSTRAINT fk_attendance FOREIGN KEY (attendance_id) REFERENCES public.attendance(id);


--
-- Name: audit_logs fk_audit_logs_branch; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT fk_audit_logs_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: device_log_mappings fk_device_log_mappings_device; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.device_log_mappings
    ADD CONSTRAINT fk_device_log_mappings_device FOREIGN KEY (device_id) REFERENCES public.devices(id) ON DELETE CASCADE;


--
-- Name: time_modification_requests fk_employee; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_modification_requests
    ADD CONSTRAINT fk_employee FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: man_hour_reports fk_employee; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.man_hour_reports
    ADD CONSTRAINT fk_employee FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: employee_device_users fk_employee_device_users_device; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_device_users
    ADD CONSTRAINT fk_employee_device_users_device FOREIGN KEY (device_id) REFERENCES public.devices(id) ON DELETE CASCADE;


--
-- Name: employee_device_users fk_employee_device_users_employee; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_device_users
    ADD CONSTRAINT fk_employee_device_users_employee FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: employees fk_employees_branch; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT fk_employees_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: forecast_logs forecast_logs_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forecast_logs
    ADD CONSTRAINT forecast_logs_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: hr_form_answers hr_form_answers_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hr_form_answers
    ADD CONSTRAINT hr_form_answers_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.hr_form_assignments(id) ON DELETE CASCADE;


--
-- Name: hr_form_answers hr_form_answers_field_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hr_form_answers
    ADD CONSTRAINT hr_form_answers_field_id_fkey FOREIGN KEY (field_id) REFERENCES public.hr_form_fields(id) ON DELETE CASCADE;


--
-- Name: hr_form_assignments hr_form_assignments_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hr_form_assignments
    ADD CONSTRAINT hr_form_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id);


--
-- Name: hr_form_assignments hr_form_assignments_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hr_form_assignments
    ADD CONSTRAINT hr_form_assignments_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: hr_form_assignments hr_form_assignments_form_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hr_form_assignments
    ADD CONSTRAINT hr_form_assignments_form_id_fkey FOREIGN KEY (form_id) REFERENCES public.hr_forms(id) ON DELETE CASCADE;


--
-- Name: hr_form_fields hr_form_fields_form_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hr_form_fields
    ADD CONSTRAINT hr_form_fields_form_id_fkey FOREIGN KEY (form_id) REFERENCES public.hr_forms(id) ON DELETE CASCADE;


--
-- Name: hr_form_submissions hr_form_submissions_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hr_form_submissions
    ADD CONSTRAINT hr_form_submissions_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.hr_form_assignments(id) ON DELETE CASCADE;


--
-- Name: hr_form_submissions hr_form_submissions_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hr_form_submissions
    ADD CONSTRAINT hr_form_submissions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: hr_form_submissions hr_form_submissions_form_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hr_form_submissions
    ADD CONSTRAINT hr_form_submissions_form_id_fkey FOREIGN KEY (form_id) REFERENCES public.hr_forms(id) ON DELETE CASCADE;


--
-- Name: hr_form_submissions hr_form_submissions_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hr_form_submissions
    ADD CONSTRAINT hr_form_submissions_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: hr_forms hr_forms_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hr_forms
    ADD CONSTRAINT hr_forms_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: job_positions job_positions_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_positions
    ADD CONSTRAINT job_positions_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: job_positions job_positions_workflow_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_positions
    ADD CONSTRAINT job_positions_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.recruitment_workflows(id);


--
-- Name: kpi_template_items kpi_template_items_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kpi_template_items
    ADD CONSTRAINT kpi_template_items_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.kpi_templates(id) ON DELETE CASCADE;


--
-- Name: leave_conversions leave_conversions_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_conversions
    ADD CONSTRAINT leave_conversions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: leaves leaves_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leaves
    ADD CONSTRAINT leaves_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: man_hour_report_details man_hour_report_details_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.man_hour_report_details
    ADD CONSTRAINT man_hour_report_details_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.man_hour_reports(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: overtime_requests overtime_requests_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.overtime_requests
    ADD CONSTRAINT overtime_requests_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: payroll payroll_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll
    ADD CONSTRAINT payroll_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: payroll payroll_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll
    ADD CONSTRAINT payroll_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: payroll payroll_locked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll
    ADD CONSTRAINT payroll_locked_by_fkey FOREIGN KEY (locked_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: payroll payroll_paid_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll
    ADD CONSTRAINT payroll_paid_by_fkey FOREIGN KEY (paid_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: payroll payroll_voided_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll
    ADD CONSTRAINT payroll_voided_by_fkey FOREIGN KEY (voided_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: raw_logs raw_logs_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.raw_logs
    ADD CONSTRAINT raw_logs_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.devices(id) ON DELETE CASCADE;


--
-- Name: recruitment_workflow_stages recruitment_workflow_stages_workflow_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruitment_workflow_stages
    ADD CONSTRAINT recruitment_workflow_stages_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.recruitment_workflows(id) ON DELETE CASCADE;


--
-- Name: recruitment_workflows recruitment_workflows_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruitment_workflows
    ADD CONSTRAINT recruitment_workflows_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;


--
-- Name: recruitment_workflows recruitment_workflows_job_position_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruitment_workflows
    ADD CONSTRAINT recruitment_workflows_job_position_id_fkey FOREIGN KEY (job_position_id) REFERENCES public.job_positions(id) ON DELETE SET NULL;


--
-- Name: rotation_group_assignments rotation_group_assignments_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rotation_group_assignments
    ADD CONSTRAINT rotation_group_assignments_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.rotation_groups(id) ON DELETE CASCADE;


--
-- Name: rotation_group_assignments rotation_group_assignments_pattern_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rotation_group_assignments
    ADD CONSTRAINT rotation_group_assignments_pattern_id_fkey FOREIGN KEY (pattern_id) REFERENCES public.rotation_patterns(id);


--
-- Name: rotation_pattern_steps rotation_pattern_steps_pattern_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rotation_pattern_steps
    ADD CONSTRAINT rotation_pattern_steps_pattern_id_fkey FOREIGN KEY (pattern_id) REFERENCES public.rotation_patterns(id) ON DELETE CASCADE;


--
-- Name: rotation_pattern_steps rotation_pattern_steps_shift_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rotation_pattern_steps
    ADD CONSTRAINT rotation_pattern_steps_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES public.shift_schedules(id);


--
-- Name: user_branch_access user_branch_access_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_branch_access
    ADD CONSTRAINT user_branch_access_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: user_branch_access user_branch_access_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_branch_access
    ADD CONSTRAINT user_branch_access_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_permissions user_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

