<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import NavBar from '../components/NavBar.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<NavBar />
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
