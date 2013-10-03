<h1>About</h1>

<section>
	<% if GroupImages %>
		<% loop GroupImages %>
			<% with Images.First %>
				<img src="{$Link}" />
			<% end_with %>
		<% end_loop %>
	<% end_if %>
</section>

<section>
	<article>
		<div>
			<p>The class <cite>New Media</cite> within the course <cite>Visual Communication</cite> at the <cite>School of Art and Design Kassel</cite> walks a fine line between art, design, provocation and study. The main focus lies on the media consumption of society and its perpetual obsession with technological progress, change and transformation; established processes and methods are permanently questioned and modified.</p>
			<p>The students in the class <cite>New Media</cite> see themselves as researchers, artists, designers and developers at the same time.</p>
			<p>Realising and publicly defending a deeply personal idea means also being able to realise the ideas of others. An outstanding developer of own concepts and ideas will have the ability to implement external ideas and concepts as well.</p>
			<p>There is no need to train service providers for an existing industry, but personalities who by discourse acquired skills which are constantly expanded and established – for oneself and others.</p>
			<p>By use of the Internet and support of the group these skills are exchanged, discussed and broadened self-educatedly. This provides a topicality and relevance which eludes institutions.</p>
			<p>To study “New Media” is to be an author. To learn from oneself, to learn seeing, speaking and thinking. To develop a culture of debate. To work on projects together. To mix media and ideas, to fail and learn from it. The aim is to shape a personal position and methodology.</p>
		</div>
	</article>
<section>

<% if Persons %>
	<section>
		<h1>Students</h1>
		<ul>
			<% loop Persons %>
				<% if IsStudent %>
					<li><a href="/about/$UrlSlug/">$FullName</a></li>
				<% end_if %>
			<% end_loop %>
		</ul>
	</section>

	<section>
		<h1>Alumni</h1>
		<ul>
			<% loop Persons %>
				<% if IsAlumni %>
					<li><a href="/about/$UrlSlug/">$FullName</a></li>
				<% end_if %>
			<% end_loop %>
		</ul>
	</section>

	<section>
		<h1>Employees</h1>
		<ul>
			<% loop Persons %>
				<% if IsEmployee %>
					<li>
						<% if Image %>
							<% with Image.Images.First %>
								<img src="$Link" alt="$Top.FullName" />
							<% end_with %>
						<% end_if %>
						<p>$JobTitle</p>
						<p><a href="/about/$UrlSlug/">$FullName</a></p>
					</li>
				<% end_if %>
			<% end_loop %>
		</ul>
	</section>
<% end_if %>