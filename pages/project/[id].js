import ProjectDetail from '../../components/project';
import Head from 'next/head';

// 실제 프로젝트에서는 이 데이터를 API나 CMS에서 가져올 수 있습니다
const projects = [
  {
    id: '1',
    title: 'Project One',
    description: '첫 번째 프로젝트에 대한 간단한 설명입니다.',
    overview: '첫 번째 프로젝트에 대한 자세한 설명입니다. 이 프로젝트는 Next.js와 styled-components를 사용하여 개발되었으며, 반응형 디자인을 적용하였습니다.',
    image: '/images/project1.jpg',
    technologies: ['React', 'Next.js', 'Styled Components'],
    demoUrl: 'https://example.com/demo1'
  },
  {
    id: '2',
    title: 'Project Two',
    description: '두 번째 프로젝트에 대한 간단한 설명입니다.',
    overview: '두 번째 프로젝트에 대한 자세한 설명입니다. 이 프로젝트는 React와 TypeScript를 사용하여 개발되었으며, 상태 관리를 위해 Redux를 활용하였습니다.',
    image: '/images/project2.jpg',
    technologies: ['React', 'TypeScript', 'Redux'],
    demoUrl: 'https://example.com/demo2'
  },
  {
    id: '3',
    title: 'Project Three',
    description: '세 번째 프로젝트에 대한 간단한 설명입니다.',
    overview: '세 번째 프로젝트에 대한 자세한 설명입니다. 이 프로젝트는 Vue.js를 사용하여 개발되었으며, Vuex를 통한 상태 관리와 Vue Router를 이용한 라우팅을 구현하였습니다.',
    image: '/images/project3.jpg',
    technologies: ['Vue.js', 'Vuex', 'Vue Router'],
    demoUrl: 'https://example.com/demo3'
  },
  {
    id: '4',
    title: 'Project Four',
    description: '네 번째 프로젝트에 대한 간단한 설명입니다.',
    overview: '네 번째 프로젝트에 대한 자세한 설명입니다. 이 프로젝트는 Node.js와 Express를 사용하여 개발된 백엔드 API이며, MongoDB를 데이터베이스로 사용하였습니다.',
    image: '/images/project4.jpg',
    technologies: ['Node.js', 'Express', 'MongoDB'],
    demoUrl: 'https://example.com/demo4'
  },
  {
    id: '5',
    title: 'Project Five',
    description: '다섯 번째 프로젝트에 대한 간단한 설명입니다.',
    overview: '다섯 번째 프로젝트에 대한 자세한 설명입니다. 이 프로젝트는 React Native를 사용하여 개발된 모바일 앱이며, Firebase를 백엔드로 활용하였습니다.',
    image: '/images/project5.jpg',
    technologies: ['React Native', 'Firebase', 'Expo'],
    demoUrl: 'https://example.com/demo5'
  },
  {
    id: '6',
    title: 'Project Six',
    description: '여섯 번째 프로젝트에 대한 간단한 설명입니다.',
    overview: '여섯 번째 프로젝트에 대한 자세한 설명입니다. 이 프로젝트는 Angular를 사용하여 개발된 웹 애플리케이션이며, NgRx를 통한 상태 관리를 구현하였습니다.',
    image: '/images/project6.jpg',
    technologies: ['Angular', 'NgRx', 'RxJS'],
    demoUrl: 'https://example.com/demo6'
  },
  {
    id: '7',
    title: 'Project Seven',
    description: '일곱 번째 프로젝트에 대한 간단한 설명입니다.',
    overview: '일곱 번째 프로젝트에 대한 자세한 설명입니다. 이 프로젝트는 Django를 사용하여 개발된 웹 서비스이며, PostgreSQL을 데이터베이스로 사용하였습니다.',
    image: '/images/project7.jpg',
    technologies: ['Django', 'PostgreSQL', 'Django REST framework'],
    demoUrl: 'https://example.com/demo7'
  },
  {
    id: '8',
    title: 'Project Eight',
    description: '여덟 번째 프로젝트에 대한 간단한 설명입니다.',
    overview: '여덟 번째 프로젝트에 대한 자세한 설명입니다. 이 프로젝트는 Flutter를 사용하여 개발된 크로스 플랫폼 앱이며, GetX를 상태 관리 솔루션으로 사용하였습니다.',
    image: '/images/project8.jpg',
    technologies: ['Flutter', 'Dart', 'GetX'],
    demoUrl: 'https://example.com/demo8'
  },
  {
    id: '9',
    title: 'Project Nine',
    description: '아홉 번째 프로젝트에 대한 간단한 설명입니다.',
    overview: '아홉 번째 프로젝트에 대한 자세한 설명입니다. 이 프로젝트는 Svelte를 사용하여 개발된 웹 애플리케이션이며, SvelteKit을 활용하여 SSR을 구현하였습니다.',
    image: '/images/project9.jpg',
    technologies: ['Svelte', 'SvelteKit', 'TailwindCSS'],
    demoUrl: 'https://example.com/demo9'
  },
  {
    id: '10',
    title: 'Project Ten',
    description: '열 번째 프로젝트에 대한 간단한 설명입니다.',
    overview: '열 번째 프로젝트에 대한 자세한 설명입니다. 이 프로젝트는 FastAPI를 사용하여 개발된 백엔드 서비스이며, Redis를 캐싱 솔루션으로 활용하였습니다.',
    image: '/images/project10.jpg',
    technologies: ['FastAPI', 'Python', 'Redis'],
    demoUrl: 'https://example.com/demo10'
  }
];

export default function Project({ project }) {
  if (!project) {
    return <div>Project not found</div>;
  }

  return (
    <>
      <Head>
        <title>{project.title} | Portfolio</title>
        <meta name="description" content={project.description} />
      </Head>
      <ProjectDetail project={project} />
    </>
  );
}

export async function getStaticPaths() {
  const paths = projects.map((project) => ({
    params: { id: project.id },
  }));

  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const project = projects.find((p) => p.id === params.id);

  if (!project) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      project,
    },
  };
} 