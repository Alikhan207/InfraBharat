CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'citizen',
    'municipal_officer',
    'contractor',
    'admin'
);


--
-- Name: report_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.report_category AS ENUM (
    'waterlogging',
    'drainage_blockage',
    'flooding',
    'road_damage',
    'other'
);


--
-- Name: report_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.report_status AS ENUM (
    'pending',
    'in_progress',
    'resolved',
    'rejected'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  -- Default role is citizen
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'citizen');
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;


--
-- Name: notify_officers_new_report(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_officers_new_report() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.severity >= 4 THEN
    INSERT INTO notifications (user_id, title, message, type, metadata)
    SELECT 
      user_roles.user_id,
      'New High-Priority Report',
      'A new high-priority report has been submitted: ' || NEW.title,
      'new_report',
      jsonb_build_object('report_id', NEW.id, 'severity', NEW.severity, 'category', NEW.category)
    FROM user_roles
    WHERE user_roles.role IN ('municipal_officer', 'admin');
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: notify_report_status_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_report_status_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO notifications (user_id, title, message, type, metadata)
    VALUES (
      NEW.user_id,
      'Report Status Updated',
      'Your report "' || NEW.title || '" status changed to ' || NEW.status,
      'report_update',
      jsonb_build_object('report_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: ai_recommendations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_recommendations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    zone_id uuid NOT NULL,
    recommendation_type text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    current_specs jsonb,
    proposed_specs jsonb,
    estimated_cost numeric(15,2),
    estimated_timeline_days integer,
    priority integer,
    status text DEFAULT 'proposed'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ai_recommendations_priority_check CHECK (((priority >= 1) AND (priority <= 5)))
);


--
-- Name: contractor_bids; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contractor_bids (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contractor_id uuid NOT NULL,
    recommendation_id uuid NOT NULL,
    bid_amount numeric(12,2) NOT NULL,
    estimated_days integer NOT NULL,
    proposal_details text,
    status text DEFAULT 'pending'::text NOT NULL,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT contractor_bids_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text, 'withdrawn'::text])))
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT notifications_type_check CHECK ((type = ANY (ARRAY['report_update'::text, 'new_report'::text, 'bid_status'::text, 'system'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text,
    phone text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    zone_id uuid,
    category public.report_category NOT NULL,
    status public.report_status DEFAULT 'pending'::public.report_status NOT NULL,
    title text NOT NULL,
    description text,
    location public.geometry(Point,4326) NOT NULL,
    address text,
    photo_urls text[],
    severity integer,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    resolved_at timestamp with time zone,
    CONSTRAINT reports_severity_check CHECK (((severity >= 1) AND (severity <= 5)))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: zones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    ward_number text,
    geometry public.geometry(Polygon,4326) NOT NULL,
    flood_risk_score numeric(3,2) DEFAULT 0,
    heat_risk_score numeric(3,2) DEFAULT 0,
    traffic_score numeric(3,2) DEFAULT 0,
    population integer,
    area_sqkm numeric(10,2),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ai_recommendations ai_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_recommendations
    ADD CONSTRAINT ai_recommendations_pkey PRIMARY KEY (id);


--
-- Name: contractor_bids contractor_bids_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contractor_bids
    ADD CONSTRAINT contractor_bids_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: zones zones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zones
    ADD CONSTRAINT zones_pkey PRIMARY KEY (id);


--
-- Name: idx_contractor_bids_contractor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contractor_bids_contractor_id ON public.contractor_bids USING btree (contractor_id);


--
-- Name: idx_contractor_bids_recommendation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contractor_bids_recommendation_id ON public.contractor_bids USING btree (recommendation_id);


--
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at DESC);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_reports_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reports_location ON public.reports USING gist (location);


--
-- Name: idx_reports_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reports_status ON public.reports USING btree (status);


--
-- Name: idx_reports_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reports_user_id ON public.reports USING btree (user_id);


--
-- Name: idx_reports_zone_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reports_zone_id ON public.reports USING btree (zone_id);


--
-- Name: idx_zones_geometry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_zones_geometry ON public.zones USING gist (geometry);


--
-- Name: reports on_new_high_priority_report; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_new_high_priority_report AFTER INSERT ON public.reports FOR EACH ROW EXECUTE FUNCTION public.notify_officers_new_report();


--
-- Name: reports on_report_status_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_report_status_change AFTER UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.notify_report_status_change();


--
-- Name: ai_recommendations update_ai_recommendations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ai_recommendations_updated_at BEFORE UPDATE ON public.ai_recommendations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contractor_bids update_contractor_bids_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_contractor_bids_updated_at BEFORE UPDATE ON public.contractor_bids FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: reports update_reports_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: zones update_zones_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_zones_updated_at BEFORE UPDATE ON public.zones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ai_recommendations ai_recommendations_zone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_recommendations
    ADD CONSTRAINT ai_recommendations_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.zones(id) ON DELETE CASCADE;


--
-- Name: contractor_bids contractor_bids_recommendation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contractor_bids
    ADD CONSTRAINT contractor_bids_recommendation_id_fkey FOREIGN KEY (recommendation_id) REFERENCES public.ai_recommendations(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reports reports_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reports reports_zone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.zones(id);


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles Admins can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: reports Citizens can create reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Citizens can create reports" ON public.reports FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: contractor_bids Contractors can create bids; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Contractors can create bids" ON public.contractor_bids FOR INSERT WITH CHECK (((contractor_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'contractor'::public.app_role))))));


--
-- Name: contractor_bids Contractors can update their own bids; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Contractors can update their own bids" ON public.contractor_bids FOR UPDATE USING ((contractor_id = auth.uid()));


--
-- Name: contractor_bids Contractors can view their own bids; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Contractors can view their own bids" ON public.contractor_bids FOR SELECT USING (((contractor_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['municipal_officer'::public.app_role, 'admin'::public.app_role])))))));


--
-- Name: ai_recommendations Everyone can view recommendations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view recommendations" ON public.ai_recommendations FOR SELECT USING (true);


--
-- Name: zones Everyone can view zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view zones" ON public.zones FOR SELECT USING (true);


--
-- Name: reports Officers and admins can delete reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Officers and admins can delete reports" ON public.reports FOR DELETE USING ((public.has_role(auth.uid(), 'municipal_officer'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: ai_recommendations Officers and admins can manage recommendations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Officers and admins can manage recommendations" ON public.ai_recommendations USING ((public.has_role(auth.uid(), 'municipal_officer'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: zones Officers and admins can manage zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Officers and admins can manage zones" ON public.zones USING ((public.has_role(auth.uid(), 'municipal_officer'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: reports Officers and admins can update any report; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Officers and admins can update any report" ON public.reports FOR UPDATE USING ((public.has_role(auth.uid(), 'municipal_officer'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: reports Users can update own reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own reports" ON public.reports FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: notifications Users can update their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING ((user_id = auth.uid()));


--
-- Name: profiles Users can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);


--
-- Name: reports Users can view all reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all reports" ON public.reports FOR SELECT USING (true);


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: notifications Users can view their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: ai_recommendations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

--
-- Name: contractor_bids; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contractor_bids ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: zones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


